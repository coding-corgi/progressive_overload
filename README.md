
# Progressive Overload 💪  
> 실무 핵심 기술들을 단순 사용이 아닌  
> **설계 → 구현 → 성능 실험 → 테스트 → 문서화**까지  
> 직접 구성하고 증명한 백엔드 실전 포트폴리오
##  목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처 다이어그램](#2-아키텍처-다이어그램)
3. [기술 스택 및 인프라](#3-기술-스택-및-인프라)
4. [Redis 캐시 성능 실험](#4-redis-캐시-성능-실험)
5. [테스트](#5-테스트)
6. [배포 상태](#6-배포-상태)
7. [회고](#7-회고)

## 1. 프로젝트 개요

#### 1.1.  도메인
  - Account Service : 회원가입, 인증, 유저 관리 (MySQL)
  - Challenge Service : 챌린지 생성, 조회, Redis 기반 캐싱 실험 (MySQL + Redis)

#### 1.2.  프로젝트 특징
- **MSA / DDD 아키텍처 기반, 컨테이너 환경(Docker) 구성**
- 서비스 간 비동기 이벤트 통신(RabbitMQ) 구조
- Redis 캐시 도입 전후 QPS, 응답시간, 캐시 적중률 측정
- **모든 기능의 흐름을 직접 설계, 구현, 실험, 문서화**


## 2. 아키텍처 다이어그램
<img src="https://github.com/user-attachments/assets/2a223e60-a337-4d6c-859c-dbd751d11d9d" width="70%" />


## 3. 기술 스택 및 인프라

|  기술 | 목적 및 사용 이유 |
|  :--- | :--- |
| `TypeScript`  | 타입 안정성, 유지보수  |
|  `NestJS` | 모듈화, 의존성 주입, MSA / DDD 설계 구조 |
|  `MySQL` | 관계형 데이터 저장, 트랜잭션 처리 |
|  `TypeORM` | DB 추상화 및 마이그레이션 관리 |
|  `Redis` | 조회병목 해소 위한 캐시 시스템|
|  `RabbitMQ` | 서비스 간 이벤트 처리(EDA 구조) 느슨한 결합 구조 |
|  `Docker` | 로컬 / 배포 환경 일관성 확보|
|  `Docker Compose` | 테스트 및 통합 실행 환경 구성 |
|  `GitHub Actions` | CI/CD 자동화 (Lint, Test, Build) |
|  `Jest` | 단위(Unit), 통합(Integration), E2E 테스트 |
|  `Artillery` | 부하 테스트 및 성능 측정 도구 |



![스킬 drawio](https://github.com/user-attachments/assets/b47b3e0a-f92c-424d-a68e-939e7a484805)


## 4. Redis 캐시 성능 실험
#### 4.1. 실험 개요
- 대상: 챌린지 로그 조회 API
- 목적: DB 직접 조회로 인한 병목 개선
- 방식: Redis TTL(Time To Live) 30초, 3,000 RPS(Requests Per Second) 부하 환경

#### 4.2. Redis 캐시 적용 전/후 성능 변화

| 지표                       | 캐시 미적용 (DB 직접 조회) | 캐시 적용 (1st miss, 이후 hit) |
|----------------------------|--------------------------|-------------------------------|
| 평균 응답속도 (ms)         | 2,773                    | 940                           |
| 중간값 (p50, ms)           | 3,262                    | 983                           |
| 95% 구간 (p95, ms)         | 6,440                    | 1,979                         |
| 최대 응답시간 (ms)         | 9,944                    | 3,124                         |
| 총 요청 수 (count)         | 6,433                    | 9,182                         |
| **Redis 캐시 적중률**      | -                        | **40%**                       |


#### 4.3. Redis info

```plaintext
keyspace_hits:             49,386
keyspace_misses:           72,658
total_commands_processed: 122,563
```
캐시 적중률 약 40%
평균 응답속도 2.7초 = > 0.9초 
p95 기준 6.4초 => 1.9초
=> DB 병목 개선 확인


## 5. 테스트

### 5.1 Swagger API 문서

- Account Service: http://localhost:3000/api-docs
- Challenge Service: http://localhost:3001/api-docs
<p float="left">
  <img src="https://github.com/user-attachments/assets/dfd0acf2-58c8-4f13-933f-b665087a1b7b" width="50%"/>
  <img src="https://github.com/user-attachments/assets/029704e3-a4ef-4ad1-a102-d1a4b4ab2e9b" width="44%"/>
</p>


### 5.2 E2E 테스트


```bash
####  Account Service E2E 테스트
pnpm test:e2e:account

####  Challenge Service E2E 테스트
pnpm test:e2e:challenge
```

- **Docker-compose.e2e.yml 기반 실행**
-  MQ, Redis, MySQL 통합 환경
-  이벤트 흐름, 캐시 흐름 포함한 테스트 시나리오 구성


#####  캐시 적중 테스트 예시 

```ts
// 1. 기존 캐시 삭제 => MISS 유도
await redis.del(cacheKey);

// 2. 챌린지 생성 (캐시 MISS 발생 유도)
await request(server).post('/challenges').send({ ... })

// 3. 첫 번째 조회 (MISS => DB 조회 발생)
const res1 = await request(server).get(`/challenges/logs/${userId}`);

// 4. 두 번째 조회 (HIT => Redis 캐시 조회)
const res2 = await request(server).get(`/challenges/logs/${userId}`);
expect(res2.body).toEqual(res1.body);

// 5. Redis 실제 캐시가 생성 확인
const cached = await redis.get(cacheKey);
expect(cached).toBeDefined();
```

### 5.3 Jest 커버리지
커버리지 75% 이상 유지 목표
메인 서비스의 분기, 예외 처리까지 테스트

<img width="60%"  alt="{44BF48C0-264F-4B62-9DFC-F301BA79A328}" src="https://github.com/user-attachments/assets/b44c5b54-69e4-49ad-92dd-78f9af764206" />


## 6. 배포 상태

- CI/CD: GitHub Actions + GHCR 자동 배포 완료
- Account Docker Image Registry: `ghcr.io/coding-corgi/account-service:latest`
- Challenge Docker Image Registry: `ghcr.io/coding-corgi/challenge-service:latest`
- 실서버 배포 별도로 하지 않고 로컬 기반 환경으로 테스트 & 검증
  
> 실제 배포 가능한 수준 구성, E2E 테스트까지 포함한 CI 완료

## 7. 회고

> 이번 프로젝트를 통해 이전 회사에서 단순히 **사용**만 해봤던 기술들을
> 직접 구성하고, 서비스 설계와 테스트, 지속적인 통합(Continuous Integration), 지속적인 제공/배포(Continuous Delivery/Deployment)까지 진행을 했습니다.
> 
> 작은 프로젝트임에도 불구하고 수많은 에러와 시행착오를 겪으며 단순히 기능을 쓸 줄 안다에서
> **문제의 근본적인 원인을 고민하며**, 해결할 수 있는 역량을 기를 수 있었습니다.
>
> 이제는 단순 기능 구현을 넘어서 **문제를 발견하고 구조적으로 해결하는 백엔드 개발자**라고 말할 수 있습니다.


