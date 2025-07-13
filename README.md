
# Progressive Overload 프로젝트

## 📚 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처 다이어그램](#2-아키텍처-다이어그램)
3. [기술 스택 & 인프라](#3-기술-스택--인프라)
4. [Redis 캐시 도입 전후 성능 실험 및 결과 분석](#4-Redis-캐시-도입-전후-성능-실험-및-결과-분석)
6. [실행/테스트](#5-실행테스트)
7. [회고/느낀점](#6-회고느낀점)

## 1. 프로젝트 개요

> **실무에서 경험한 핵심 백엔드 기술들을
> 단순 사용이 아닌 설계→구현→성능 실험→지표→문서화까지  
> ‘실제 서비스’ 수준으로 증명하는 백엔드 프로젝**

#### 1.1. 🧩 핵심 도메인
  - Account Service : 회원가입/인증/유저 관리 (MySQL)
  - Challenge Service : 챌린지 생성/조회 중심, Redis 기반 캐싱 실험 (MySQL + Redis)

#### 1.2. 🛠 프로젝트 특징
- **MSA/DDD 아키텍처 기반, 컨테이너 환경(Docker)에서 구성**
- RabbitMQ 기반 비동기 이벤트 통신 구조로 유저 검증 처리
- Redis 캐싱 도입 전후 성능 지표 측정 → QPS/응답시간/캐시 적중률 등 정량 실험
- **모든 기능의 흐름을 직접 설계 → 구현 → 실험 → 문서화**


## 2. 아키텍처 다이어그램
![제목 없는 다이어그램의 복사본 drawio](https://github.com/user-attachments/assets/2a223e60-a337-4d6c-859c-dbd751d11d9d)


## 3. 기술 스택 & 인프라

|  기술 | 목적 및 사용 이유 |
|  :--- | :--- |
| `TypeScript`  | 타입 안정성, 유지보수성, 대규모 서비스 적합  |
|  `NestJS` | 모듈화, DI, MSA/DDD 아키텍처에 적합 |
|  `MySQL` | 관계형 데이터, 트랜잭션 지원|
|  `TypeORM` | DB 추상화 + Migration, NestJS와 적합 |
|  `Redis` | QPS 병목 해소로 응답 속도 향상 |
|  `RabbitMQ` | 서비스 간 비동기 이벤트 통신(EDA), 서비스 간 느슨한 결합 구조 |
|  `Docker` | 로컬/서버 동일 환경 일관성|
|  `Docker Compose` | 다중 서비스 로컬 실행 및 통합 테스트 |
|  `GitHub Actions` | CI/CD 자동화 (테스트/빌드/배포) |
|  `Jest` | 단위(Unit), 통합(Integration), E2E 테스, 안정성 검증 |
|  `Artillery` | QPS/응답속도/성능 측정 도구 활용 |



![스킬 drawio](https://github.com/user-attachments/assets/b47b3e0a-f92c-424d-a68e-939e7a484805)


## 4. Redis 캐시 도입 전후 성능 실험 및 결과 분석

#### 4.1. Redis 캐시 적용 전/후 성능 변화

| 지표                       | 캐시 미적용 (DB 직접 조회) | 캐시 적용 (1st miss, 이후 hit) |
|----------------------------|--------------------------|-------------------------------|
| 평균 응답속도 (mean, ms)   | 2,773                    | 940                           |
| 중간값 (p50, ms)           | 3,262                    | 983                           |
| 95% 구간 (p95, ms)         | 6,440                    | 1,979                         |
| 최대 응답시간 (max, ms)    | 9,944                    | 3,124                         |
| 총 요청 수 (count)         | 6,433                    | 9,182                         |
| **Redis 캐시 적중률**      | -                        | **40%**                       |

📊 **응답속도 분포 (p50/p95/max)**
|        | p50        | p95         | max        |
|--------|------------|-------------|------------|
| 미적용 | ■■■■■ 3,262 | ■■■■■■■ 6,440 | ■■■■■■■■ 9,944 |
| 적용   | ■■ 983     | ■■■ 1,979    | ■■■■ 3,124  |

> **캐시 미적용:** 모든 요청이 DB로 → 응답 p95=6초, p99=8.7초까지 지연  
> **캐시 적용:** 첫 miss 후 거의 모든 요청이 redis에서 반환 → 평균 1초 이하로 감소


#### 4.2. Redis 캐시 info 결과

```plaintext
# Stats (INFO)
keyspace_hits:             49,386
keyspace_misses:           72,658
total_commands_processed: 122,563
total_error_replies:        3,107
```


#### 4.3. 실험 환경 및 방법
> 모든 실험은 **Docker compose** 기반 단일 서버(Ryzen 7 2700x, 32GB RAM) 환경
> **DB/Redis/서비스**  컨테이너 분리, Artillery로 최대 3,000 RPS/20초 부하
> **Redis 캐시 TTL** 30초, 단일 인스턴스 기준


#### 4.4. 실험 결과 요약/인사이트

> “Redis 캐시 도입 후 QPS 3,000 환경에서 DB 병목 구간이 p95=6.4초 → 1초 이하로 크게 개선됨.
> 실제 장애내성, 응답 속도, 확장성 개선 효과를 수치로 입증.”


#### 4.5. 테스트 기반 캐시 검증 + 종료 안정화
> 실제 캐시 HIT/MISS 동작과 Redis Key 생성 여부를 e2e 테스트로 검증,
> 테스트 종료 시 리소스 누수 문제를 해결하여 안정성을 확보.

##### ✅ 캐시 적중 테스트 예시 (Jest e2e)

```ts
const userId = 4;
const cacheKey = `cache:challenge:${userId}`;

// 1. 기존 캐시 삭제 => MISS 유도
await redis.del(cacheKey);

// 2. 챌린지 생성 (캐시 MISS 발생 유도)
await request(server)
  .post('/challenges')
  .send({ ... })
  .expect(201);

// 3. 첫 번째 조회 (MISS => DB 조회 발생)
const res1 = await request(server).get(`/challenges/logs/${userId}`).expect(200);

// 4. 두 번째 조회 (HIT => Redis 캐시 조회)
const res2 = await request(server).get(`/challenges/logs/${userId}`).expect(200);
expect(res2.body).toEqual(res1.body);

// 5. Redis에 실제 캐시가 생성되었는지 확인
const cached = await redis.get(cacheKey);
expect(cached).toBeDefined();
```

##### ✅ Redis 종료 누락 문제 해결 (`ioredis` open handle)

- 전역 Redis 클라이언트 직접 생성 시 Jest 테스트 종료 시점에 리소스가 남는 이슈 발생
- onApplicationShutdown() 훅에서 redis.quit() 명시하여 안전하게 종료
- --detectOpenHandles 옵션으로 리소스 누수 없는 종료 검증 가능

```ts
@Module({...})
export class RedisModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    if (redis) {
      await redis.quit(); // 테스트 종료 시 안전하게 shutdown
    }
  }
}
```

##### 🧪 실행 결과 변화 (before → after)




|   상황 |  메세지 |
|--------|-------|
| ⛔ 변경 전 | A worker process has failed to exit gracefully... |
| ✅ 변경 후 | Test Suites: 3 passed, 3 total (no open handles) |


> ✅ Redis 캐시 생성 흐름과 테스트 종료 안정성까지 엔드투엔드(e2e) 기반으로 함께 검증하며,
> 단순 기능을 넘어서 시스템 레벨 안정성까지 테스트로 증명했습니다.
## 5. 실행/테스트

### 🟦 Swagger API 문서

- Account Service: http://localhost:3000/api-docs
- Challenge Service: http://localhost:3001/api-docs
- 각 서비스에서 엔드포인트/요청·응답 예시/테스트 가능
<p float="left">
  <img src="https://github.com/user-attachments/assets/dfd0acf2-58c8-4f13-933f-b665087a1b7b" width="49%"/>
  <img src="https://github.com/user-attachments/assets/029704e3-a4ef-4ad1-a102-d1a4b4ab2e9b" width="49%"/>
</p>


### 🔧 테스트 실행 방법

#### ▶️ Account Service E2E 테스트
```bash
pnpm test:e2e:account
```
#### ▶️ Challenge Service E2E 테스트
```
pnpm test:e2e:challenge
```


## 6. 회고/느낀점

> 이번 프로젝트를 통해 이전 회사에서 단순히 **사용**만 해봤던 기술들을
> 실제 서비스 아키텍처/운영/성능/자동화까지 직접 설계하고 실험하며 실무 환경에 가깝게 경험했습니다.
> 
> 작은 프로젝트임에도 불구하고 수많은 에러와 시행착오를 겪으며 단순히 기능을 쓸 줄 안다에서
> **문제를 정의하고 근본적인 원인을 고민하며**, 직접 해결할 수 있는 역량을 기를 수 있었습니다
> 
> 이제는 **문제를 발견하고 구조적으로 해결하는 개발자**라고 말할 수 있습니다


