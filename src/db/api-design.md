# API 接口设计文档

## 基础信息

- **Base URL**: `http://localhost:3000/api` (开发环境)
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 通用查询参数

- `filter`: 过滤条件（JSON 对象，如 `{"is_published": true}`）
- `sort`: 排序字段（如 `"-created_date"` 表示降序，`"created_date"` 表示升序）
- `limit`: 返回数量限制
- `offset`: 偏移量（用于分页）
- `page`: 页码（与 limit 配合使用）

---

## 1. 用户认证 API

### 1.1 发送验证码
```
POST /api/auth/send-verification-code
Body: {
  "email": "user@example.com"
}
Response: {
  "success": true,
  "message": "验证码已发送"
}
```

### 1.2 验证码登录
```
POST /api/auth/verify-code
Body: {
  "email": "user@example.com",
  "code": "123456"
}
Response: {
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "用户名",
    "created_date": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 Google 登录
```
POST /api/auth/google
Body: {
  "token": "google_id_token"
}
Response: {
  "success": true,
  "token": "jwt_token_string",
  "user": { ... }
}
```

### 1.4 获取当前用户信息
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "用户名",
    "avatar_url": "...",
    "role": "user",
    "created_date": "2024-01-01T00:00:00Z"
  }
}
```

### 1.5 登出
```
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "success": true,
  "message": "登出成功"
}
```

---

## 2. 小说 API (Novels)

### 2.1 获取小说列表
```
GET /api/novels?filter={"is_published":true}&sort=-created_date&limit=20
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "小说标题",
      "author": "作者名",
      "description": "简介",
      "genre": "玄幻·奇幻",
      "cover_image": "url",
      "status": "ongoing",
      "is_published": true,
      "tags": ["tag1", "tag2"],
      "total_chapters": 100,
      "reads_count": 1000,
      "rating": 4.5,
      "content_updated_date": "2024-01-01T00:00:00Z",
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 2.2 获取单个小说
```
GET /api/novels/:id
Response: {
  "success": true,
  "data": { ... }
}
```

### 2.3 创建小说（需要认证）
```
POST /api/novels
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "title": "小说标题",
  "author": "作者名",
  "description": "简介",
  "genre": "玄幻·奇幻",
  ...
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 2.4 更新小说（需要认证）
```
PUT /api/novels/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "reads_count": 1001,
  ...
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 2.5 获取小说章节列表（优化查询）
```
GET /api/novels/:id/chapters
Query: ?published=true&sort=chapter_number
Response: {
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "uuid",
        "novel_id": "uuid",
        "chapter_number": 1,
        "title": "第一章",
        "word_count": 3000,
        "published": true,
        "created_date": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100
  }
}
```

---

## 3. 章节 API (Chapters)

### 3.1 获取章节列表
```
GET /api/chapters?filter={"novel_id":"uuid"}&sort=chapter_number
Response: {
  "success": true,
  "data": [ ... ]
}
```

### 3.2 获取单个章节
```
GET /api/chapters/:id
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "novel_id": "uuid",
    "chapter_number": 1,
    "title": "第一章",
    "content": "章节内容...",
    "word_count": 3000,
    "published": true,
    "created_date": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 创建章节（需要认证）
```
POST /api/chapters
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "novel_id": "uuid",
  "chapter_number": 1,
  "title": "第一章",
  "content": "章节内容...",
  "published": true
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 3.4 更新章节（需要认证）
```
PUT /api/chapters/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Body: { ... }
Response: {
  "success": true,
  "data": { ... }
}
```

---

## 4. 阅读进度 API (Reading Progress)

### 4.1 获取阅读进度列表
```
GET /api/reading-progress?filter={"user_id":"uuid"}
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "novel_id": "uuid",
      "current_chapter": 10,
      "progress_percentage": 50.5,
      "last_read_date": "2024-01-01T00:00:00Z",
      "is_favorite": true,
      "reading_status": "reading",
      "last_read_paragraph_index": 5,
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4.2 创建阅读进度（需要认证）
```
POST /api/reading-progress
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "novel_id": "uuid",
  "current_chapter": 1,
  "progress_percentage": 0,
  "reading_status": "reading",
  "is_favorite": false
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 4.3 更新阅读进度（需要认证）
```
PUT /api/reading-progress/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "current_chapter": 11,
  "progress_percentage": 55.0,
  "last_read_paragraph_index": 10,
  "last_read_date": "2024-01-01T00:00:00Z"
}
Response: {
  "success": true,
  "data": { ... }
}
```

---

## 5. 评论 API (Comments)

### 5.1 获取评论列表
```
GET /api/comments?filter={"target_type":"novel","target_id":"uuid"}&sort=-created_date
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "target_type": "novel",
      "target_id": "uuid",
      "paragraph_index": null,
      "parent_comment_id": null,
      "user_id": "uuid",
      "user_name": "用户名",
      "content": "评论内容",
      "likes_count": 10,
      "replies_count": 2,
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 5.2 创建评论（需要认证）
```
POST /api/comments
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "target_type": "novel",
  "target_id": "uuid",
  "paragraph_index": null, // 仅当 target_type = 'paragraph' 时使用
  "parent_comment_id": null, // 回复评论时使用
  "content": "评论内容"
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 5.3 更新评论（需要认证）
```
PUT /api/comments/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "content": "更新后的评论内容"
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 5.4 删除评论（需要认证）
```
DELETE /api/comments/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "success": true,
  "message": "删除成功"
}
```

---

## 6. 点赞 API (Likes)

### 6.1 获取点赞列表
```
GET /api/likes?filter={"user_id":"uuid"}
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "comment_id": "uuid",
      "created_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6.2 点赞评论（需要认证）
```
POST /api/likes
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "comment_id": "uuid"
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 6.3 取消点赞（需要认证）
```
DELETE /api/likes?comment_id=uuid
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "success": true,
  "message": "取消点赞成功"
}
```

---

## 7. 评分 API (Ratings)

### 7.1 获取评分列表
```
GET /api/ratings?filter={"novel_id":"uuid"}
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "novel_id": "uuid",
      "rating": 5,
      "review": "评价文字",
      "created_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 7.2 创建/更新评分（需要认证）
```
POST /api/ratings
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "novel_id": "uuid",
  "rating": 5,
  "review": "评价文字（可选）"
}
Response: {
  "success": true,
  "data": { ... }
}
```

### 7.3 获取小说平均评分
```
GET /api/novels/:id/rating
Response: {
  "success": true,
  "data": {
    "rating": 4.5,
    "rating_count": 100,
    "user_rating": 5 // 当前用户的评分（如果已登录）
  }
}
```

---

## 8. 作者资料 API (Author Profiles)

### 8.1 获取作者资料列表
```
GET /api/author-profiles?filter={"bc_address":"0x..."}
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bc_address": "0x...",
      "pseudonym": "作者笔名",
      "email": "author@example.com",
      "bio": "作者简介",
      "avatar_url": "url",
      "cover_url": "url",
      "is_celebrity": false,
      "is_kyc": false,
      "is_verified": true,
      "is_active": true,
      "create_time": 1704067200000,
      "update_time": 1704067200000
    }
  ]
}
```

### 8.2 获取单个作者资料
```
GET /api/author-profiles/:id
Response: {
  "success": true,
  "data": { ... }
}
```

### 8.3 创建/更新作者资料（需要认证）
```
POST /api/author-profiles
PUT /api/author-profiles/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Body: { ... }
Response: {
  "success": true,
  "data": { ... }
}
```

---

## 9. 特殊功能 API

### 9.1 获取小说章节列表（优化版本）
```
GET /api/functions/get-novel-chapters-for-list?novel_id=uuid
Response: {
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "uuid",
        "chapter_number": 1,
        "title": "第一章",
        "word_count": 3000,
        "published": true
      }
    ]
  }
}
```

---

## 错误码说明

- `UNAUTHORIZED` (401): 未认证或 token 无效
- `FORBIDDEN` (403): 无权限访问
- `NOT_FOUND` (404): 资源不存在
- `VALIDATION_ERROR` (400): 请求参数验证失败
- `INTERNAL_ERROR` (500): 服务器内部错误

---

## 注意事项

1. **认证**: 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. **分页**: 使用 `limit` 和 `offset` 或 `page` 参数进行分页
3. **排序**: `sort` 参数支持 `-field`（降序）和 `field`（升序）
4. **过滤**: `filter` 参数是 JSON 对象，支持多条件过滤
5. **时间格式**: 所有时间字段使用 ISO 8601 格式（如 `2024-01-01T00:00:00Z`）

