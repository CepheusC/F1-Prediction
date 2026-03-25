# F1 赛季预测对比系统（MVP）技术方案

## 技术栈（目标）

- 前端：React + TypeScript + Vite + Tailwind
- 后端：Node.js + Express（提供 `/api/*`）
- 数据与鉴权：Supabase（Postgres + Auth + RLS）
- 部署：Vercel（前端静态 + API 路由转发）

## 环境变量

前端：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

后端（仅服务端）：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 目录结构约定

- `src/`：前端
- `api/`：后端
- `shared/`：共享类型与评分逻辑（纯函数）
- `supabase/migrations/`：SQL 迁移

## 数据库与权限策略（摘要）

### 表

- `profiles(user_id, nickname, role)`：与 Supabase Auth user 关联
- `drivers`
- `seasons`
- `race_events`
- `predictions`
- `race_results`
- `scores`

### RLS 要点

- 公共读取：`drivers(seasons/race_events)` 允许 `anon`/`authenticated` SELECT（方便未登录浏览也可开；MVP 可仅允许 authenticated）
- 写入限制：
  - `predictions`：仅 `auth.uid() = user_id` 且未过截止时间
  - 管理表写入：仅管理员（通过 `profiles.role='admin'`）
- `scores`：普通用户可读（排行榜需要），写入仅服务端（service role）或管理员

### 权限 GRANT

开启 RLS 后仍需显式 GRANT：

- `GRANT SELECT ON ... TO anon;`
- `GRANT ALL PRIVILEGES ON ... TO authenticated;`（或按需细分）

## API 设计（MVP）

约定：后端通过 Bearer token 验证 Supabase user，并做管理员校验。

公共：

- `GET /api/health`
- `GET /api/public/drivers`
- `GET /api/public/seasons/current`
- `GET /api/public/events?seasonId=`
- `GET /api/public/leaderboard?seasonId=`
- `GET /api/public/series?seasonId=`（折线图数据）

用户：

- `GET /api/me`
- `GET /api/events/:id/my-prediction`
- `POST /api/events/:id/prediction`

管理员：

- `POST /api/admin/drivers`
- `PATCH /api/admin/drivers/:id`
- `POST /api/admin/seasons`
- `POST /api/admin/events`
- `POST /api/admin/events/:id/result`
- `POST /api/admin/events/:id/finalize`

## 评分计算

评分逻辑放在 `shared/scoring.ts`，后端 finalize 时：

- 读取该 event 的所有 prediction
- 读取/校验 result（必须已存在且 5 个位置齐全）
- 对每个用户计算分数并 upsert `scores`

## 本地运行

- `npm install`
- `npm run dev`：同时启动前端与后端（前端代理 `/api`）

## 部署（Vercel）

- 前端构建产物静态托管
- `/api/*` rewrite 到后端入口
- 环境变量在 Vercel 项目中配置：前端的 `VITE_*` 与后端的 service role

