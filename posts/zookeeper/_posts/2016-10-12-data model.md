---
layout: post
title:  "Data Model"
date:   2016-10-12 23:06:00 +0000
tags: ['Zookeeper']
author: "AngJoong"
description: "주키퍼의 핵심 데이터 모델 제트노드"
---

주키퍼는 계층적 네임 스페이스를 갖는다. 분산 파일 시스템과 상당히 비슷하지만 각 노드는 자식 노드 뿐만아니라 자신의 데이터를 갖는다는 차이점이 있다. 마치 파일스템의 파일이 파일이면서 디렉토리인 것을 허용한거와 같다. 노드 까지의 경로는 슬래쉬(/)로 나뉘어 지는 절대 경로이다. 상대 경로는 사용하지 않는다. 경로에 대한 자세한 규칙은 다음 [경로 규칙](https://zookeeper.apache.org/doc/trunk/zookeeperProgrammers.html#ch_zkDataModel)을 참고하라.  


# 1. 제트노드(ZNodes)
주키퍼 트리의 모든 노드들은 제트노드라고 부른다. 제트노드는 데이터 변경, ACL 변경에 대한 버전 넘버를 포함하는 **스탯 구조(Stat Structure)를 관리**한다. 스탯 구조는 타임스탬프 또한 갖는다. 타임스탬프와 함께 버전 정보는 주키퍼가 캐쉬 유효성 검사와 업데이트 조정을 할 수 있게 해준다. 제트노드의 데이터가 변경될 때마다 버전 넘버는 증가한다. 예를 들어 클라이언트가 데이터를 조회할 때마다, 클라이언트는 데이터의 버전 정보 또한 받는다. 그리고 사용자가 업데이트 하거나 딜리트 할때 변경하는 제트노드 데이터의 버전 넘버를 제공해야 한다. 만약 제공한 버전 넘버가 데이터의 실제 버전 정보와 같지 않으면, 업데이트는 실패할 것이다. 제트노드는 프로그래머가 접근하게되는 주 엔티티이며 몇가지 특성을 갖는다.

## 1.1 워치(Watches)
클라이언트는 제트노드에 워치설정을 할 수 있다. 제트노드의 변경에 워치가 실행되고 워치는 사라진다. 워치가 실행되면, 주키퍼는 클라이언트에 알림을 보낸다. 워치에 대한 자세한 내용은 [워치]()를 참고하라.

## 1.2 데이터 엑세스(Data Access)
네임스페이스의 각 제트노드에 저장된 데이터는 아토믹하게 읽고 쓴다. 읽기는 제트노드와 관련된 모든 데이터 바이트를 읽고 쓰기는 데이터 전부를 교체한다. 각 노드는 ACL(Access Control List)를 갖는다.

주키퍼는 일반적인 데이터베이스나 대용량 오브젝트 저장소와는 다르게 디자인되어 있다. 대신에 주키퍼는 코디네이션 데이터를 관리한다. 이 데이터는 설정, 상태 정보 등의 형태를 갖는다. 코디네이션 데이터의 다양한 형태중 보편적인 속성은 상대적으로 작다(약 KB)는 것이다. 주키퍼 클라이언트와 서버는 제트노드의 데이터가 1M이 넘지 않는 것을 보장하기 위해 체크하지만 평균을 넘지 않는걸 권장한다. 상대적으로 큰 데이터를 운영하는건 데이터를 네트워크와 저장소로 옮기기 위해  많은 시간을 할애하게해 대기 시간에 영향을 미친다. 만약 대용량의 데이터 저장소가 필요하다면 NFS 또는 HDFS와 같은 벌크 스토리지 시스템에 데이터를 저장하고 저장소의 위치 데이터만 주키퍼에 저장하는 패턴을 사용한다.  

## 1.3 임시 노드(Ephemeral Nodes)
주키퍼는 임시노드라는 개념있다. 임시노드는 제트노드를 생성한 세션이 활성화 되어 있는 동안 존재한다. 세션이 종료되면 제트노드도 제거된다. 이러한 규칙때문에 임시노드는 자식 노드를 갖지 못한다.  

## 1.4 시퀀스 노드(Sequence Nodes)
제트노드를 생성할때 경로의 끝에 일정하게 증가하는 카운터를 붙일 수 있다. 이 카운터는 부모 노드에 대해서 유니크하며 010d 와 같은 0으로 패딩된 10진수를 형태를 갖는다. 부모노드에 의해서 관리되는 시퀀스 넘버는 signed int(4bytes)로 2147483647이 넘으면 오버플로우가 발생한다.  

## 1.5 컨테이너 노드(Container Nodes) - 3.6.0v
컨테이너 노드는 리더, 락과 같은 기능 구현에 유용한 특별한 목적의 노드이다. 컨테이너의 마지막 자식 노드가 제거되면 컨테이너는 추후 어떤 시점에서 서버에 의해 제거될 수 있는 대상이 된다.  

# 2. 주키퍼의 시간
주키퍼는 다양한 방법으로 시간을 관리한다.  

### 2.1 Zxid
주키퍼 모든 상태 변경은 zxid(Zookeeper Transaction Id) 형태의 스탬프를 받는다. zxid는 **주키퍼의 모든 변화들에 대한 순서**를 보여준다. 각 변화는 유니크한 zxid를 갖는다. zxid1이 zxid2 보다 작으면 zxid1이 xzid2이전에 발생한것이다.  

### 2.2 Version numbers
노드의 모든 변경은 그 노드의 버전 넘버들중 하나를 증가시킨다. 세가지의 버전 넘버들이 있는데 version(제트노드 데이터에 대한 변경), cversion(제트노드 자식들에 대한 변경), aversion(제트노드 ACL에 대한 변경) 이다.  

### 2.3 Ticks
다중 서버 주키퍼를 사용할때 서버들은 상태 업로드, 세션 타임아웃, 피어간 연결 타임 아웃 등 과 같은 이벤트 타이밍을 정의하기 위해 틱을 사용한다.  

### 2.4 Real Time
제트노드 생성, 변경시 스탯 구조에 타임스탬프를 넣을때를 제외하고 주키퍼는 실제 시간을 사용하지 않는다.  

# 3주키퍼 스탯 구조
제트노드의 스탯구조는 다음 필드를 갖는다.  
czxid
The zxid of the change that caused this znode to be created.
mzxid
The zxid of the change that last modified this znode.
pzxid
The zxid of the change that last modified children of this znode.
ctime
The time in milliseconds from epoch when this znode was created.
mtime
The time in milliseconds from epoch when this znode was last modified.
version
The number of changes to the data of this znode.
cversion
The number of changes to the children of this znode.
aversion
The number of changes to the ACL of this znode.
ephemeralOwner
The session id of the owner of this znode if the znode is an ephemeral node. If it is not an ephemeral node, it will be zero.
dataLength
The length of the data field of this znode.
numChildren
The number of children of this znode











\#1. https://zookeeper.apache.org/doc/trunk/zookeeperOver.html