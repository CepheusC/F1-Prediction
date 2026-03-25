# F1 赛季预测对比系统（MVP）需求确认稿

## 目标

为一群好友提供一个可在线参与的 F1 赛季预测对比系统：

- 多用户登录
- 管理员维护赛季/比赛与车手名单
- 用户在截止时间前提交每场 Session 的前 5 预测
- 管理员赛后录入真实结果并“最终确认”
- 系统自动评分、累计赛季总分、输出排行榜
- 前端提供排行榜与累计积分折线图对比

## 角色

- 普通用户：注册/登录、浏览比赛、提交预测、查看排行榜与图表
- 管理员：维护车手、赛季、比赛、录入结果并 finalize

MVP 中管理员身份通过数据库 `profiles.role = 'admin'` 配置。

## 核心数据模型（MVP 字段）

### Driver

- `id`
- `name`
- `team`
- `is_active`
- `created_at`

### Season

- `id`
- `year`

### RaceEvent

- `id`
- `season_id`
- `round`
- `grand_prix_name`
- `session_type`（`Quali | Race | Sprint | Sprint Quali`）
- `event_date`
- `prediction_deadline`
- `status`（`scheduled | locked | finished`）

### Prediction

- `id`
- `user_id`
- `event_id`
- `p1_driver_id`..`p5_driver_id`
- `submitted_at`
- `is_locked`

### RaceResult

- `id`
- `event_id`
- `p1_driver_id`..`p5_driver_id`
- `is_finalized`

### Score

- `id`
- `user_id`
- `event_id`
- `score`
- `breakdown`（JSON）

## MVP 业务规则

### 预测提交与锁定

- 每个 `event` 预测前 5 名
- 必须填满 5 个位置
- 不允许重复车手
- 当前时间 >= `prediction_deadline`：后端拒绝写入；前端禁止提交
- `prediction_deadline` 到达后，系统视为锁定（MVP 用查询时计算锁定状态 + 写入时校验）

### 结果录入与 finalize

- 管理员录入前 5
- `is_finalized = true` 后触发评分计算
- MVP：已 finalize 的结果不可修改（需要变更可在数据库中手工回滚 `is_finalized`）

### 评分（可调参数）

MVP 默认：位置权重 + 距离惩罚 + 排序奖励

- 位置基础分：`[25, 18, 15, 12, 10]`
- 距离惩罚：`penalty = 4 * |predPos - actualPos|`
- 单位置得分：`max(0, base - penalty)`
- 排序奖励：对预测 Top5 的任意一对 `(A,B)`，若预测 A 在 B 前且实际也在前，`+2` 分

输出 `breakdown` 包含：每个位置 base/penalty/earned、排序奖励、总分。

## MVP 页面范围

- `/login`：邮箱+密码登录/注册
- `/`：当前赛季比赛列表（按 round 分组展示 session）
- `/events/:id`：预测提交（下拉选择，自动去重/校验）
- `/leaderboard`：排行榜 + 累计积分折线图
- `/admin`：入口页
- `/admin/drivers`：车手增删改启停
- `/admin/seasons`：赛季创建
- `/admin/events`：比赛创建
- `/admin/results`：结果录入 + finalize

## 非 MVP / 可延后

- 拖拽排序交互
- 多赛季并行与赛季切换
- 丢弃最差 N 场
- 结果 finalize 后允许二次确认修改
- 更多统计面板

