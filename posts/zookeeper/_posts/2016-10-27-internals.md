---
layout: post
title:  "Internals"
date:   2016-10-27 23:01:00 +0000
tags: ['Zookeeper']
author: "AngJoong"
description: "원자성 브로드캐스팅, 로깅등 주키퍼 내부 프로세스에 대해 알아보자"
---

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

FLP는 고장이 가능한 비동기 분산 시스템에서 컨센서스를 달성 할 수 없다는 것을 증명했다.


[^23]

[^23]

\#1.  [FLP](http://the-paper-trail.org/blog/a-brief-tour-of-flp-impossibility/): 비동기에서 하나의 프로세서라도 중단될 경우, 컨센서스 문제를 해결할 수 있는 분산 알고리즘은 없다. 지연될 순 있으나 손실되진 않는 비동기 네트워크에서, 적어도 하나의 노드가 Fail-Stop이라면 모든 실행에서(in every execution for all starting conditions) 종료가 보장되는 컨센서스([Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) 알고리즘은 없다.

\#2.  Fail-Stop: 오류 발생시, 불완전한 동작을 하지 않고 바로 멈추는 것

\#3.  [Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science): 분산 컴퓨팅과 다중 에이전트 시스템에서의 근본적인 문제는 다수의 결함이 있는 프로세스들의 존재하에서 전체 시스템 안정성을 달성하는 것이다. 이것은 종종 **계산시 필요한 일부 데이터의 값에 동의하는 과정**이 필요하다. 컨센서스(Conssensus) 프로그램의 예로는 데이터베이스에 트랜잭션을 커밋할 것인지, 리더 식별에 대한 동의(agreeing on the identity of), 상태 머신 복제 및 아토믹 브로드캐스팅을 포함한다.
<br>
<br>
<br>
<br>
<br>

\#1. https://zookeeper.apache.org/doc/trunk/zookeeperProgrammers.html#ch_zkWatches
