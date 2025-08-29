# 考场查询接口说明文档

## 接口信息

- **接口URL**: `/api/admin/exam-room`
- **请求方式**: GET
- **接口描述**: 获取考场列表数据，支持分页、搜索和筛选

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 当前页码 |
| pageSize | number | 否 | 10 | 每页显示数量 |
| searchText | string | 否 | "" | 搜索关键词（考点/考场名） |
| siteID | string | 否 | "" | 选中的考点ID |
| startTime | string | 是 |  | 开始时间 |
| endTime | string | 是 |  | 结束时间 |
| examId | string | 否 | "" | 考试ID |

## 响应参数

```typescript
{
  status: number,      // 状态码，0表示成功
  msg: string,         // 响应消息
  api: string,         // API路径
  method: string,      // 请求方法
  data: {              // 数据对象
    rooms: Array<{     // 考场列表
      id: number,      // 考场ID
      name: string,    // 考场名称
      exam_site_name: string,  // 考点名称
      capacity: number // 考场容量
    }>,
    sites: Array<{     // 考点列表
      id: number,      // 考点ID
      name: string     // 考点名称
    }>
  },
  rowCount: number     // 总记录数
}
```

## 示例

### 请求示例
```
GET /api/admin/exam-room?page=1&pageSize=10&searchText=&siteID=&startTime=2025-05-02 13:00:00&endTime=2025-05-02 14:00:00&examId=1
```

### 响应示例
```json
{
  "status": 0,
  "msg": "Get exam sites successful",
  "api": "/api/admin/exam-room",
  "method": "Get",
  "data": {
    "rooms": [
      {
        "id": 1,
        "name": "考场1",
        "exam_site_name": "考点1",
        "capacity": 30
      }
    ],
    "sites": [
      {
        "id": 1,
        "name": "考点1"
      }
    ]
  },
  "rowCount": 1
}
```

## 注意事项

1. 时间格式为 "YYYY-MM-DD HH:mm:ss"
2. 分页参数从1开始计数
3. 搜索关键词支持模糊匹配

