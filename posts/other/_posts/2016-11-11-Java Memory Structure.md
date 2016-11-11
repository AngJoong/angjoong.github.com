---
layout: post
title:  "Java Memory Structure"
date:   2016-11-11 22:00:00 +0000
description: 자바 메모리 구조 요약
tags: ['Java', 'Memory']
author: "AngJoong"
---

# 1. 자바 실행 환경 및 구조
프로그램이 실행되기 위해서는 운영체제(OS)가 제어하고 있는 시스템의 리소스의 일부인 메모리를 제어할수 있어야 한다. C같은 대부분의 언어로 만들어진 프로그램은 이러한 이유때문에 OS에 종속되어 실행된다.  

자바 애플리케이션은 JVM(Java Virtual Machine)이라는 프로그램만 있으면 실행이 가능하다. JVM이 OS에게서 메모리 사용권한을 할당받고 JVM이 자바 애플리케이션을 호출하여 실행한다. OS한태서는 독립되었지만 JVM에 종속적이게 된다.  

###### &lt;Java 애플리케이션 실행 환경>
![](http://cfile7.uf.tistory.com/image/03289A4B51A455601F4C48)

* Class Loader  
: JVM내로 클래스를 로드하고 링크를 통해 배치하는 작업을 수행하는 모듈로써 **런타임시 동적으로 클래스를 로드** 한다.

* Execution Engine  
: Class Loader를 통해 JVM 내의 런타임 데이터 영역에 배치된 **자바 바이트 코드를 명령어 단위로 읽어서 실행** 한다.

* Garbage Collector  
: 애플리케이션이 생성한 객체의 생존 여부를 판단하여 더 이상 사용되지 않는 **객체를 해제하는 방식으로 메모리를 자동 관리** 한다.

* Runtime Data Areas  
: JVM이 운영체제 위에서 실행되면서 **할당받는 메모리 영역** 이다. Class Loader에서 준비한 데이터들을 보관하는 저장소이다.

###### &lt;Java 애플리케이션 실행 구조>
![](http://cfile27.uf.tistory.com/image/0139C94D51A4557F390D7A)

# 2. 자바 메모리 구조

![](http://cfile24.uf.tistory.com/image/216AE04C5654207F0AA967)

## 2.1 Method Area(static or class)
JVM이 읽어들인 런타임 상수 풀, **멤버 변수**, **스태틱 변수**, 생성자와 메소드를 저장하는 공간이다.

## 2.2 Runtime Constant Pool
클래스와 인터페이스 **상수**, 메소드와 필드에 대한 모든 **레퍼런스** 를 저장한다. JVM은 런타임 상수 풀을 통해 해당 메소드나 필드의 실제 메모리 상 주소를 찾아 참조한다

## 2.3 Stack Area
각 **스레드마다 하나씩 존재** 하며, 스레드가 시작될 때 할당된다. 메소드를 호출할 때마다 프레임을 추가하고 종료되면 해당 프레임을 제거하는 선입후출(FILO) 구조 이다.
메소드 호출 시 생성되는 **프레임(메소드 정보, 지역변수, 매개변수, 연산 중 발생하는 임시 데이터)** 을 저장한다.

## 2.4 Native Method Stack Area
**자바 외 언어로 작성된 네이티브 코드** 를 위한 Stack이다. 즉, JNI(Java Native Interface)를 통해 호출되는 C/C++ 등의 코드를 수행하기 위한 스택이다.

## 2.5 PC Register
현재 **수행 중인 JVM 명령 주소** 를 갖는다. 보통 CPU가 명령어를 처리 하는 과정에서 수행하는 동안 필요한 정보를 Register라는 CPU내의 기억장치에 저장해 둔다. 이는 CPU에 종속적 일 수 밖에 없다. 이러한 CPU내의 Register의 역할을 JVM상에 논리적인 메모리 영역으로 구현한다.  

## 2.6 Heap
런타임 시 **동적으로 할당하여 사용하는 영역** 이다. New 연산자로 생성된 객체와 배열을 저장한다. 힙 영역에 생성된 객체와 배열은 스택 영역의 변수나 다른 객체의 필드에서 참조한다. 참조가 없다면 의미 없는 객체가 되어 GC의 대상이 된다.

\#1. Java Memory - http://hoonmaro.tistory.com/19
