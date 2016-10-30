---
layout: post
title:  "Internals"
date:   2016-10-27 23:01:00 +0000
tags: ['Zookeeper']
author: "AngJoong"
description: "아토믹 브로드캐스팅, 로깅등 주키퍼 내부 프로세스"
---

# Quorums
'Atomic Broadcast'와 'Leader Election'은 시스템의 일관된 뷰를 보장하기 위해 쿼럼(Quorums)을 사용한다. 주키퍼는 티폴트 값으로 과반수 이상의 투표가 요구되는 과반수 쿼럼을 사용한다. `Acknowledging a leader proposal`는 그 예로 서버들의 쿼럼으로부터 acknowledgement를 받아야 리더가 커밋할 수 있다.  

## 과반수 쿼럼(Majority Quorums)
만약 과반수 쿼럼을 사용하기 위해 반드시 필요한 속성을 추출하자면, 최소 하나의 서버에서 쌍으로 교차 투표함으로써 작업을 검증하기 위한 프로세스들의 그룹을 보장할 필요가 있다. 과반수는 이 속성을 보장한다.
-> 과반수 쿼럼을 사용하게 되면 과반수 이하의 서버들에 장애가 났을때 나머지 서버들에서 쿼럼을 얻게되면 두 쿼럼간에 반드시 중복되는 최소 하나의 서버가 있기때문에 정상적인 데이터 처리가 가능하다.

과반수와는 다른 쿼럼을 구성하는 여러 방법이 있다.  

## 가중치 쿼럼(Weights Quorums)
서버들의 투표에 가중치(Weights)를 할당해 몇몇 서버들의 투표를 더 중요하게 여긴다. 가중치 쿼럼을 얻으려면, 전체 서버들의 가중치 합의 절반보다 쿼럼 가중치의 합이 더 커야한다.  

## 계층 쿼럼(Hierarchical Quorums)
가중치를 사용하며 넓은 지역 배포(wide-area deployments in co-locaiton)에서 유용하다. 이 구성은 서버들을 분리된 그룹으로 나누고 각 서버에 가중치를 할당한다. 쿼럼을 만들기 위해선 과반수 이상의 그룹이 쿼럼이 되어야 한다. 그룹내 쿼럼 가중치의 합이 해당 그룹의 총 가중치보다 크면 해당 그룹은 쿼럼 그룹이 된다. 흥미로운 것은 이 구성은 쿼럼을 작게 만들 수 있다. 예를들어 서버가 9개가 있다면, 3그룹으로 나누고 각 서버에 1의 가중치를 할당하면 쿼럼을 4개로 구성할 수 있다.(각 그룹중 2개의 그룹에서 2개씩만 뽑아내는 경우라고 생각된다.) Note that two subsets of processes composed each of a majority of servers from each of a majority of groups necessarily have a non-empty intersection. It is reasonable to expect that a majority of co-locations will have a majority of servers available with high probability.

아... 계층 쿼럼....



# Atomic Broadcast
주키퍼의 핵심은 모든 서버의 동시성 유지시키는 아토믹 메시징 시스템에 있다.  

## Guarantees, Properties, and Definitions
주키퍼 메시징 시스템은 아래와 같은 보장성을 제공한다.

### 신뢰성있는 전송(Reliable delivery)
만약 한 서버에 의해 M이 전달되면, 결국 모든 서버에 의해 전달될 것이다.  

### 전체 순서(Total order)
만약 A가 하나의 서버에 의해 B보다 먼저 전송되면, A는 모든 서버에 의해 B보다 먼저 전달될 것이다.  
만약 A, B가 전송된 메세지라면, A는 B전에 전송되거나 B가 A전에 전달된다.  

### 인과 순서(Causal order)
만약 B가 B의 샌더에 의해 전송이 완료된 A 다음에 전송된다면, A는 B보다 먼저 주문된 것이다.
만약 샌더가 B를 보내고 나서 C를 전송했다면, C는 B 다음 순서로 주문된 것이다.

주키퍼 메시징 시스템은 유지하기 위해 효율적이고 안정적이며 구현하고 유지하기 쉬워야 한다. 우리는 메시지를 많이 사용하기 때문에 시스템이 초마다 수천개의 요청을 다를수 있어야한다.  우리는 메세지를 보내기 위해 최소 K+1개의 정상 서버를 요구하더라도, 전력 중단과 같은 실패로 부터 복구할 수 있어야 한다. 시스템을 구현할때, 시간도 없고 엔지니어링 리소스도 부족했다. 그래서 엔지니어가 접근하기 쉽고 구현하기 쉬운 프로토콜이 필요했다. 이러한 모든 목표를 만족시켜 프로토콜을 개발했다.  

이 프로토콜은 서버간 point-to-point FIFO 채널을 구축할 수 있다고 가정한다. 유사 서비스들은 메시지 전달이 손실되거나 재전송 될 수 있다고 가정하는 반면, 주키퍼의 FIFO 채널에 대한 가정은 통신을 위해 사용하는 TCP에 매우 실용적이다. 특히 TCP의 다음 특성들에 의존한다.  

### 순서화된 전달(Ordered delivery)
데이터는 보낸 순서대로 전달된다. 그리고 메세지 M은 M전에 보낸 모든 메시지가 전달 된 후에 만 전달된다. (이에 대한 추론으로 M이 손실 될 경우 M 이후 모든 메시지는 손실 될 것이다.)

### 종료 후 메시지 없음(No message after close)
한번 FIFO 채널이 닫히면, 전달받을 수 있는 메시지는 없다.

FLP는 장애가 발생할 수 있는 비동기 분산 시스템에서 컨센서스(Consensus)를 달성 할 수 없다는 것을 증명했다. 장애의 존재에에서 컨센서스를 달성을 보장하기 위해 타임아웃을 사용한다. correctness가 아니라 liveness를 위해 시간에 의존한다. 그래서 만약 타임아웃이 작동을 멈춘다면, 메시징 시스템은 중단될 수 있다. 그렇다고 보장성을 어기지는 않는다.  

주키퍼 메시징 프로토콜을 이야기 할때 패킷(Packet), 프로포절(Proposal) 및 메세지(message)를 이야기한다.

### 패킷(Packet)
FIFO 채널에 의해 보내지는 바이트의 시퀀스

### 프로포절(Proposal)
동의의 단위. 프로포절은 주키퍼의 정족수(Quorum)와 패킷을 교혼하여 합의된다. 대부분 프로포절은 메시지를 포함하지만, NEW_LEADER 프로포절은 메시지를 포함하지 않는 예이다.

### 메시지(Message)
모든 주키퍼 서버로 자동으로 브로드캐스트되는 바이트의 시퀀스

주키퍼는 메시지의 전체 순서(Total Order)를 보장한다고 앞서 말한거처럼, 프로포절의 전체 순서(Total Order) 또한 보장한다. 모든 프로포절은 제안될때 zxid 스탬프를 찍고 전체 순서를 반영할 것이다. 프로퍼절은 주키퍼로 보내지고 주키퍼 정족수가 프로포절에 동의(Acknowledgement)했을때 커밋한다. 만약 프로퍼절이 메시지를 포함하고 있다면, 메시지는 프로포절이 커밋될때 전달될것이다. 동의(Acknowledgement)는 서버가 영구 저장소에 프로포절을 기록했다는것을 의미한다. 우리의 정족수들은 어떠한 정족수의 쌍이라도 반드시 최소 하나의 공통서버를 가져야 된다는 요구사항이 있다.(쿼럼 장애에 대한 복구시 데이터 복원을 위해) 우리는 주키퍼 서비를 구성하는 서버의 수가 n일때, n/2+1개의 정족수를 요구함으로써 이와 같은 문제를 보장한다.  

zxid는 두 부분으로 나뉜다: epoch와 counter이다.



\#1.  [FLP](http://the-paper-trail.org/blog/a-brief-tour-of-flp-impossibility/): 비동기에서 하나의 프로세서라도 중단될 경우, 컨센서스 문제를 해결할 수 있는 분산 알고리즘은 없다. 지연될 순 있으나 손실되진 않는 비동기 네트워크에서, 적어도 하나의 노드가 Fail-Stop이라면 모든 실행에서(in every execution for all starting conditions) 종료가 보장되는 컨센서스([Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) 알고리즘은 없다.

\#2. Fail-Stop: 오류 발생시, 불완전한 동작을 하지 않고 바로 멈추는 것

\#3.  [Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science): 분산 컴퓨팅과 다중 에이전트 시스템에서의 근본적인 문제는 다수의 결함이 있는 프로세스들의 존재하에서 전체 시스템 안정성을 달성하는 것이다. 이것은 종종 **계산시 필요한 일부 데이터의 값에 동의하는 과정**이 필요하다. 컨센서스(Conssensus) 프로그램의 예로는 데이터베이스에 트랜잭션을 커밋할 것인지, 리더 식별에 대한 동의(agreeing on the identity of), 상태 머신 복제 및 아토믹 브로드캐스팅을 포함한다.

\#4. Quorum:

\#5. [주키퍼 과반수 쿼럼](http://hamait.tistory.com/193)


<br>
<br>
<br>
<br>
<br>

\#1. https://zookeeper.apache.org/doc/trunk/zookeeperProgrammers.html#ch_zkWatches