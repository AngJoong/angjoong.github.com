---
layout: post
title:  "Data Model"
date:   2016-10-12 23:06:00 +0000
tags: ['Zookeeper']
author: "AngJoong"
description: "분산 응용프로그램을 위한 분산 코디네이션 서비스"
---

주키퍼는 계층적 네임 스페이스를 갖는다. 분산 파일 시스템과 상당히 비슷하지만 각 노드는 자식 노드 뿐만아니라 자신의 데이터를 갖는다는 차이점이 있다. 마치 파일스템의 파일이 파일이면서 디렉토리인 것을 허용한거와 같다. 노드 까지의 경로는 슬래쉬(/)로 나뉘어 지는 절대 경로이다. 상대 경로는 사용하지 않는다. 경로에 대한 자세한 규칙은 다음 [경로 규칙](https://zookeeper.apache.org/doc/trunk/zookeeperProgrammers.html#ch_zkDataModel)을 참고하라.  


# 제트노드(ZNodes)







\#1. https://zookeeper.apache.org/doc/trunk/zookeeperOver.html