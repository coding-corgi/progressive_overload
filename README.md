
# Progressive Overload 프로젝트


## 1. 도메인 설계 (Domain-Driven Design)


### 1.1. 유비쿼터스 언어 (Ubiquitous Language)


| 단어 (영문/한글) | 설명 (초안) | 비고 |
| :--- | :--- | :--- |
| **User** (유저) | 서비스를 사용하는 회원. | 암호화 인증  |
| **Challenge** (챌린지) | "30일 벤치프레스 100kg 달성"과 같은 구체적인 목표. 시작일/종료일이 있음. |  |
| **Exercise** (운동) | 벤치프레스, 스쿼트 등 개별 운동 종목. | 운동 부위(가슴/등/하체), 장비(바벨/덤벨) 등의 속성 추가 |
| **Routine** (루틴) | 특정 챌린지의 특정일에 수행해야 할 운동의 조합. (e.g., 월요일 루틴) | |
| **PerformanceLog** (수행기록) | "2023-10-27, 벤치프레스, 80kg, 5회, 3세트" 같은 실제 운동 수행 데이터. | 대용량 트래픽 처리 |
| **GrowthMetric** (성장지표) | 수행기록을 바탕으로 계산된 값. (e.g., 총 볼륨, 1RM 추정치) | Redis에 캐싱 빠르게 조회 |
| **Feed** (피드) | 사용자의 주요 활동(챌린지 시작, 목표 달성 등)이 올라오는 소셜 타임라인. | |
| **CheerUp** (응원) | 다른 사용자의 피드에 보내는 '좋아요' 같은 긍정적 상호작용. | |


### 1.2. 바운디드 컨텍스트 (Bounded Context)


| 컨텍스트 (서비스명) | 포함하는 언어들 | 핵심 책임 (Responsibilities) |
| :--- | :--- | :--- |
| **Account Context** | `User` | 회원가입, 인증(로그인), 인가, 프로필 관리 |
| **Challenge Context** | `Challenge`, `Exercise`, `Routine`, `PerformanceLog`, `GrowthMetric` | 챌린지 생성/참여/관리, 운동 기록, 성장 지표 계산 |
| **Social Context** | `Feed`, `CheerUp`, `User` (참조) | 팔로우/팔로워 관리, 피드 생성 및 조회, 응원/댓글 기능 |
| **Notification Context** | (이벤트 수신) | 웹소켓 기반 실시간 알림, (향후) 이메일/푸시 알림 |


## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 | 목적 및 사용 이유 |
| :--- | :--- | :--- |
| **언어/프레임워크** | `TypeScript`, `NestJS` | 타입 안정성 확보 및 DDD, MSA 구현에 용이한 아키텍처 |
| **데이터베이스** | `MySQL`, `TypeORM` | 핵심 데이터 저장을 위한 관계형 데이터베이스 및 ORM |
| | `Redis` | 성장 지표, 인기 피드 등 자주 조회되는 데이터 캐싱으로 응답 속도 향상 |
| **메시지 브로커** | `RabbitMQ` | 서비스 간 비동기 이벤트 통신을 통한 시스템 결합도 감소 (EDA 구현) |
| **개발/배포 환경** | `Docker`, `Docker Compose` | 로컬 개발 환경의 일관성 유지 및 간편한 서비스 관리 |
| | `GitHub Actions` | 테스트 및 빌드 자동화를 통한 CI(Continuous Integration) 구축 |
| **테스트** | `Jest` | 단위(Unit), 통합(Integration), E2E 테스트를 통한 코드 안정성 확보 |