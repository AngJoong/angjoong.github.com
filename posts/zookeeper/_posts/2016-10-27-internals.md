---
layout: post
title:  "Internals"
date:   2016-10-27 23:01:00 +0000
tags: ['Zookeeper']
author: "AngJoong"
description: "아토믹 브로드캐스팅, 로깅등 주키퍼 내부 프로세스"
---

# 1. Atomic Broadcast
주키퍼의 핵심은 모든 서버간 동기화를 유지시키는 아토믹 메시징 시스템에 있다. - [Atomic Broadcase](http://www.cs.yale.edu/homes/aspnes/pinewiki/Broadcast.html)  

## 1.1 Guarantees
주키퍼가 사용하는 메시징 시스템이 제공하는 보장성은 아래와 같다.  

* **신뢰성 전송(Reliable delivery)**  
  만약 한 서버가 메세지 M을 전송하면, 결국 모든 서버로 메세지 M은 전송될 것이다.

* **전체 순서(Total order)**  
 **전송된 순서와 관계없이 모든 서버들에서 메세지를 받는 순서가 같다.** 만약 하나의 서버에서 메세지 A가 메세지 B보다 먼저 전송되면, 모든 서버에서도 A는 B보다 먼저 전송된다. M1, M2 순으로 전송된 메세지들이 하나의 서버에 M2, M1순으로 전달 되는 경우에 모든 서버에서도 M2, M1 순으로 메세지를 받는다.

* **인과 순서([Causal order](http://scattered-thoughts.net/blog/2012/08/16/causal-ordering/))**  
각 서버 A, B에서 A의 이벤트 a가 00:00:00, B의 이벤트 b가 00:00:01발생했다면 a가 더 빨리 발생했을 수도 있고 상대적으로 시간만 b보다 빠를 수도 있다. 이런 경우 순서를 보장하기 위해서 두 이벤트 사이에 a이벤트 발생 -> A-B간 이벤트 발생 -> b이벤트 발생 와 같이 인과관계가 생기면 순서를 보장할 수 있다.


###### &lt;Causal Order>
![](https://upload.wikimedia.org/wikipedia/commons/5/55/Vector_Clock.svg)

## 1.2 Properties
주키퍼 메시징 시스템은 효율적이고 안정적이며 구현과 유지보수가 쉬워야 한다. 주키퍼는 많은 메시지를 사용하기 때문에 초마다 수천개의 요청을 다를수 있어야한다. 주키퍼는 메세지를 보내기 위해 최소 K+1개의 정상 서버를 요구하지만, 전력 중단과 같은 실패로 부터 복구할 수 있어야 한다.  

주키퍼는 이러한 속성을 만족하는 프로토콜을 발견했다. 이 프로토콜은 서버간 point-to-point FIFO 채널을 구축할 수 있다고 가정한다. 유사 서비스들은 메시지가 손실되거나 재전송 될 수 있다고 가정하지만, **통신을 위해 TCP를 사용**하는 것이 FIFO 채널에 매우 실용적일것이라 생각했다. 특히 TCP의 다음 특성들에 의존한다.  

* **순서화된 전달(Ordered delivery)**  
데이터는 보낸 순서대로 전달된다. 그리고 메세지 M은 M이 전달되기 이전에 보낸 모든 메시지가 전달된 후에 전달된다. (이에 대한 추론으로 M이 손실 될 경우 M 이후 모든 메시지는 손실 될 것이다.)

* **종료 후 메시지 없음(No message after close)**  
한번 FIFO 채널이 닫히면, 전달받을 수 있는 메시지는 없다.

## 1.3 Definitions

FLP는 장애가 발생할 수 있는 비동기 분산 시스템에서 컨센서스(Consensus)가 달성될 수 없음을 증명했다. 장애가 있을때 컨센서스 달성을 보장하기 위해 타임아웃을 사용한다. `correctness`가 아니라 `liveness`를 위해 시간에 의존한다. 그래서 만약 타임아웃이 작동을 멈춘다면(장애를 체크하는), 메시징 시스템은 중단될 수 있지만 보장성을 어기지는 않는다. (So, if timeouts stop working (clocks malfunction for example) the messaging system may hang, but it will not violate its guarantees.)

주키퍼 메시징 프로토콜을 이야기 할때 패킷(Packet), 프로포절(Proposal) 및 메세지(message)를 이야기한다.

* **패킷(Packet)**  
FIFO 채널에 의해 보내지는 바이트의 시퀀스

* **프로포절(Proposal)**  
합의(Agreement)의 단위. 프로포절은 주키퍼의 쿼럼(Quorum)이 패킷을 교환함으로써 합의된다. 대부분의 프로포절은 메시지를 포함하지만, NEW_LEADER 프로포절은 메시지를 포함하지 않는 예이다.

* **메시지(Message)**
모든 주키퍼 서버로 자동으로 브로드캐스트되는 바이트의 시퀀스. 메세지는 프로포절에 포함되며 전달되기 전에 합의가 이루어진다.

주키퍼는 메시지의 전체 순서(Total Order)를 보장한다고 앞서 말한거처럼, 프로포절의 전체 순서(Total Order) 또한 보장한다. 주키퍼는 zxid(주키퍼 트랜잭션 아이디)를 사용해 전체 순서를 나타낸다. 모든 프로포절은 제안되고 정확한 전체 순서를 반영할때 zxid를 갖는다. 프로퍼절은 주키퍼의 정족수가 프로포절에 승인(Acknowledgement)했을때 주키퍼로 보내지고 커밋된다. 만약 프로퍼절이 메시지를 포함하고 있다면, 메시지는 프로포절이 커밋될때 전달될것이다. 승인은 서버가 영구 저장소에 프로포절을 기록하는것을 의미한다. 정족수들은 어떠한 정족수의 쌍이라도 반드시 최소 하나의 공통서버를 가져야 된다는 요구사항이 있다.(쿼럼 장애에 대한 복구시 데이터 복원을 위해) 주키퍼 서버의 수가 n개 일때, n/2+1개의 정족수를 요구함으로써 이와 같은 문제를 보장한다.  

zxid는 두 부분으로 나뉜다: epoch와 counter이다. zxid는 64-bit로 구현되어 있다. 상위 32-bit는 epoch, 하위 32-bit는 counter에 사용된다. zxidr가 두 부분으로 나뉘기 때문에 넘버나 정수의 쌍(epoch, counter)으로 나타낸다. (Because it has two parts represent the zxid both as a number and as a pair of integers.) epoch는 리더의 변경을 나타낸다. 새로운 리더가 선출될 때마다 그 리더만의 epoch 넘버를 갖는다. 유니크한 zxid를 프로포절에 할당하는 간단한 알고리즘이 있다: 리더는 단순히 각 프로포절을 위한 zxid를 얻기 위해 zxid를 증가시킨다.  

주키퍼 메시징은 두 페이즈(phases)로 나뉜다.

* **리더 활성화(Leader activation)**  
리더는 시스템의 정상 상태를 설정하고 프로포절만드는것을 시작할 준비를 한다.

* **액티브 메시징(Active Messaging)**  
리더는 프로포절을위한 메세지를 받고 메세지 전달을 코디네이트한다.  

리더는 쿼럼이 리더와 같은 상태(state)로 동기화 했을때만 활성화 된다. 상태는 리더가 커밋되었다고 믿는 모든 프로포절과 리더를 따르게 하는 NEW_LEADER 프로포절로 구성되어 있다.  


# 2. Quorums
'Atomic Broadcast'와 'Leader Election'은 시스템의 일관된 뷰를 보장하기 위해 쿼럼(Quorums)을 사용한다. 주키퍼는 티폴트 값으로 과반수 이상의 투표가 요구되는 과반수 쿼럼을 사용한다. `Acknowledging a leader proposal`는 그 예로 서버들의 쿼럼으로부터 acknowledgement를 받아야 리더가 커밋할 수 있다.  

## 2.1 과반수 쿼럼(Majority Quorums)
만약 과반수 쿼럼을 사용하기 위해 반드시 필요한 속성을 추출하자면, 최소 하나의 서버에서 쌍으로 교차 투표함으로써 작업을 검증하기 위한 프로세스들의 그룹을 보장할 필요가 있다. 과반수는 이 속성을 보장한다.
-> 과반수 쿼럼을 사용하게 되면 과반수 이하의 서버들에 장애가 났을때 나머지 서버들에서 쿼럼을 얻게되면 두 쿼럼간에 반드시 중복되는 최소 하나의 서버가 있기때문에 정상적인 데이터 처리가 가능하다.

과반수와는 다른 쿼럼을 구성하는 여러 방법이 있다.  

## 2.2 가중치 쿼럼(Weights Quorums)
서버들의 투표에 가중치(Weights)를 할당해 몇몇 서버들의 투표를 더 중요하게 여긴다. 가중치 쿼럼을 얻으려면, 전체 서버들의 가중치 합의 절반보다 쿼럼 가중치의 합이 더 커야한다.  

## 2.3 계층 쿼럼(Hierarchical Quorums)
가중치를 사용하며 넓은 지역 배포(wide-area deployments in co-locaiton)에서 유용하다. 이 구성은 서버들을 분리된 그룹으로 나누고 각 서버에 가중치를 할당한다. 쿼럼을 만들기 위해선 과반수 이상의 그룹이 쿼럼이 되어야 한다. 그룹내 쿼럼 가중치의 합이 해당 그룹의 총 가중치보다 크면 해당 그룹은 쿼럼 그룹이 된다. 흥미로운 것은 이 구성은 쿼럼을 작게 만들 수 있다. 예를들어 서버가 9개가 있다면, 3그룹으로 나누고 각 서버에 1의 가중치를 할당하면 쿼럼을 4개로 구성할 수 있다.(각 그룹중 2개의 그룹에서 2개씩만 뽑아내는 경우라고 생각된다.) Note that two subsets of processes composed each of a majority of servers from each of a majority of groups necessarily have a non-empty intersection. It is reasonable to expect that a majority of co-locations will have a majority of servers available with high probability.

<br>
<br>
<br>
<br>
<br>

\#1.  FLP - http://the-paper-trail.org/blog/a-brief-tour-of-flp-impossibility/  
: 비동기에서 하나의 프로세서라도 중단될 경우, 컨센서스 문제를 해결할 수 있는 분산 알고리즘은 없다. 지연될 순 있으나 손실되진 않는 비동기 네트워크에서, 적어도 하나의 노드가 Fail-Stop이라면 모든 실행에서(in every execution for all starting conditions) 종료가 보장되는 컨센서스(Consensus) 알고리즘은 없다.

\#2. Fail-Stop  
: 오류 발생시, 불완전한 동작을 하지 않고 바로 멈추는 것

\#3. Consensus - https://en.wikipedia.org/wiki/Consensus_(computer_science : 분산 컴퓨팅과 다중 에이전트 시스템에서의 근본적인 문제는 다수의 결함이 있는 프로세스들의 존재하에서 전체 시스템 안정성을 달성하는 것이다. 이것은 종종 **계산시 필요한 일부 데이터의 값에 동의하는 과정**이 필요하다. 컨센서스(Conssensus) 프로그램의 예로는 데이터베이스에 트랜잭션을 커밋할 것인지, 리더 식별에 대한 동의(agreeing on the identity of), 상태 머신 복제 및 아토믹 브로드캐스팅을 포함한다.

\#4. Quorum - http://terms.naver.com/entry.nhn?docId=1140788&cid=40942&categoryId=31645  
: 합의체가 의사(議事)를 진행시키거나 의결을 하는 데 필요한 최소한도의 인원수

\#5. 주키퍼 과반수 쿼럼 - http://hamait.tistory.com/193

\#6. Zookeeper Internals - https://zookeeper.apache.org/doc/trunk/zookeeperInternals.html#sc_atomicBroadcast  

\#7. Atomic Broadcast - http://www.cs.yale.edu/homes/aspnes/pinewiki/Broadcast.html  

\#8. Causal Order - http://scattered-thoughts.net/blog/2012/08/16/causal-ordering/
