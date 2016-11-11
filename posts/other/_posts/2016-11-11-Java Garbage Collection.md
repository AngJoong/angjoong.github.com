---
layout: post
title:  "Java Garbage Collection"
date:   2016-11-11 22:00:00 +0000
description: 자바 가비지 컬렉션. NAVER D2의 내용을 공부를 위해 요약
tags: ['Java', 'Garbage Collection']
author: "AngJoong"
---

# 1. 가비지 컬렉션

어떤 GC 알고리즘을 사용하더라도 STW(Stop The World)는 발생한다. 대개의 경우 GC 튜닝이란 이 STW 시간을 줄이는 것이다.   

자바에서는 프로그램 코드로 메모리를 명시적으로 해제하지 않기 때문에 가비지 컬렉터가 더 이상 **필요 없는 (쓰레기) 객체를 찾아 지우는 작업** 을 한다. 이 가비지 컬렉터는 `weak generational hypothesis` 라는 두 가지 전제 조건하에 만들어졌다.  

1. 대부분의 객체는 금방 접근 불가능 상태(unreachable)가 된다.
2. 오래된 객체에서 젊은 객체로의 참조는 아주 적게 존재한다.

이 가설의 장점을 최대한 살리기 위해서 HotSpot VM에서는 크게 2개로 물리적 공간을 나누었다. 둘로 나눈 공간이 **Young 영역** 과 **Old 영역** 이다.

# 2. 영역 및 구조

* **Young 영역** (Yong Generation 영역)  
: **새롭게 생성한 객체** 의 대부분이 여기에 위치한다. 대부분의 객체가 금방 접근 불가능 상태가 되기 때문에 매우 많은 객체가 Young 영역에 생성되었다가 사라진다. 이 영역에서 객체가 사라질때 Minor GC가 발생한다고 말한다.

* **Old 영역** (Old Generation 영역)  
: 접근 불가능 상태로 되지 않아 **Young 영역에서 살아남은 객체** 가 여기로 복사된다. 대부분 Young 영역보다 크게 할당하며, 크기가 큰 만큼 Young 영역보다 GC는 적게 발생한다. 이 영역에서 객체가 사라질 때 Major GC(혹은 Full GC)가 발생한다고 말한다.

* **Perm 영역** (Permanent Generation 영역 or Method Area)  
: **객체나 억류(intern)된 문자열 정보** 를 저장하는 곳이며, Old 영역에서 살아남은 객체가 영원히 남아 있는 곳은 절대 아니다. 이 영역에서 GC가 발생할 수도 있는데, 여기서 GC가 발생해도 Major GC의 횟수에 포함된다.

###### &lt;영역별 데이터 흐름>
![](http://d2.naver.com/content/images/2015/06/helloworld-1329-1.png)

* **카드 테이블**  (Card Table)  
: 카드 테이블에는 Old 영역에 있는 객체가 Young 영역의 객체를 참조할 때마다 정보가 표시된다. Young 영역의 GC를 실행할 때에는 Old 영역에 있는 모든 객체의 참조를 확인하지 않고, 이 **카드 테이블만 뒤져서 GC 대상인지 식별** 한다.

###### &lt;카드 테이블 구조>
![](http://d2.naver.com/content/images/2015/06/helloworld-1329-2.png)

# 3. Young 영역 - Minor GC
Young 영역은 다시 Eden 영역과 2개의 Survivor 영역으로 나뉜다. Minor GC에 따른 각 영역의 처리 절차는 다음과 같다.  

1. 새로 생성한 대부분의 객체는 Eden 영역에 위치한다.
2. Eden 영역에서 GC가 한 번 발생한 후 살아남은 객체는 Survivor 영역 중 하나로 이동된다.
3. Eden 영역에서 GC가 발생하면 이미 살아남은 객체가 존재하는 Survivor 영역으로 객체가 계속 쌓인다.
4. 하나의 Survivor 영역이 가득 차게 되면 그 중에서 살아남은 객체를 다른 Survivor 영역으로 이동한다. 그리고 가득 찬 Survivor 영역은 아무 데이터도 없는 상태로 된다.
5. 이 과정을 반복하다가 계속해서 살아남아 있는 객체는 Old 영역으로 이동하게 된다.

###### &lt;Minor GC>
![](http://d2.naver.com/content/images/2015/06/helloworld-1329-3.png)

# 4. Old 영역 - Major GC

Old 영역은 기본적으로 데이터가 가득 차면 GC를 실행한다. GC 방식에 따라서 처리 절차가 달라지므로, 어떤 GC 방식이 있는지 살펴보면 이해가 쉬울 것이다. GC 방식은 JDK 7을 기준으로 5가지 방식이 있다.  

* Serial GC
* Parallel GC
* Parallel Old GC(Parallel Compacting GC)
* Concurrent Mark & Sweep GC(이하 CMS)
* G1(Garbage First) GC

<br>
<br>
<br>
<br>
<br>

\#1. STW(Stop The World) - GC을 실행하기 위해 JVM이 애플리케이션 실행을 멈추는 것이다. STW가 발생하면 GC를 실행하는 쓰레드를 제외한 나머지 쓰레드는 모두 작업을 멈춘다. GC 작업을 완료한 이후에야 중단했던 작업을 다시 시작한다.


\#1. Garbage Collection - <http://d2.naver.com/helloworld/1329>
