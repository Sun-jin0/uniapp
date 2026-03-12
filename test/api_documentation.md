# 香港小姐竞选投票系统 - REST API 设计文档

## 概述

本文档描述了香港小姐竞选投票系统的 REST API 设计，遵循 RESTful 设计原则，使用 JSON 作为数据交换格式。

**基础 URL**: `/api/v1`

**认证方式**: Bearer Token

---

## 1. 注册相关

### 1.1 发送验证码

**请求**

```http
POST /api/v1/voters/verification_code
Content-Type: application/json
```

**请求体**

```json
{
  "phone": "91234567",
  "hkid": "A123456(7)"
}
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "message": "验证码已发送",
  "data": {
    "expires_in": 600
  }
}
```

**响应失败 (422 Unprocessable Entity)**

```json
{
  "success": false,
  "message": "香港身份证格式不正确"
}
```

---

### 1.2 用户注册

**请求**

```http
POST /api/v1/voters
Content-Type: application/json
```

**请求体**

```json
{
  "phone": "91234567",
  "name": "张三",
  "hkid": "A123456(7)",
  "verification_code": "123456"
}
```

**响应成功 (201 Created)**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "voter": {
      "id": 1,
      "phone": "91234567",
      "name": "张三",
      "phone_verified": true
    }
  }
}
```

---

## 2. 登录相关

### 2.1 用户登录

**请求**

```http
POST /api/v1/sessions
Content-Type: application/json
```

**请求体**

```json
{
  "phone": "91234567",
  "hkid": "A123456(7)"
}
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "voter": {
      "id": 1,
      "phone": "91234567",
      "name": "张三",
      "auth_token": "abc123xyz789"
    }
  }
}
```

---

### 2.2 用户登出

**请求**

```http
DELETE /api/v1/sessions
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 3. 候选人相关

### 3.1 候选人列表

**请求**

```http
GET /api/v1/candidates?page=1&per_page=20
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": 1,
        "candidate_number": "001",
        "name": "候选人A",
        "age": 22,
        "description": "个人简介...",
        "vote_count": 1234,
        "primary_photo_url": "https://example.com/photos/1.jpg"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_count": 100
    }
  }
}
```

---

### 3.2 候选人详情

**请求**

```http
GET /api/v1/candidates/:id
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "data": {
    "candidate": {
      "id": 1,
      "candidate_number": "001",
      "name": "候选人A",
      "age": 22,
      "description": "个人简介...",
      "vote_count": 1234,
      "primary_photo_url": "https://example.com/photos/1.jpg",
      "photo_urls": [
        "https://example.com/photos/1.jpg",
        "https://example.com/photos/2.jpg"
      ]
    }
  }
}
```

---

## 4. 投票相关

### 4.1 提交投票

**请求**

```http
POST /api/v1/votes
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**请求体**

```json
{
  "candidate_id": 1
}
```

**响应成功 (201 Created)**

```json
{
  "success": true,
  "message": "投票成功",
  "data": {
    "vote": {
      "id": 1,
      "voter_id": 1,
      "candidate_id": 1,
      "created_at": "2024-02-15 14:30:00"
    }
  }
}
```

---

### 4.2 撤销投票

**请求**

```http
DELETE /api/v1/votes
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "message": "投票已撤销"
}
```

---

### 4.3 我的投票

**请求**

```http
GET /api/v1/votes/my_vote
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "data": {
    "vote": {
      "id": 1,
      "voter_id": 1,
      "candidate_id": 1,
      "created_at": "2024-02-15 14:30:00"
    }
  }
}
```

---

## 5. 排行榜

### 5.1 获取排行榜

**请求**

```http
GET /api/v1/rankings?limit=10
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "candidate": {
          "id": 1,
          "candidate_number": "001",
          "name": "候选人A",
          "vote_count": 1234
        }
      }
    ]
  }
}
```

---

## 6. 赛事信息

### 6.1 当前赛事

**请求**

```http
GET /api/v1/contest_sessions/current
Authorization: Bearer <auth_token>
```

**响应成功 (200 OK)**

```json
{
  "success": true,
  "data": {
    "contest_session": {
      "id": 1,
      "name": "2024香港小姐竞选",
      "year": "2024",
      "voting_start_at": "2024-02-01 00:00:00",
      "voting_end_at": "2024-02-28 23:59:59",
      "status": "ongoing"
    }
  }
}
```
