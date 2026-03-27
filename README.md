# FIO Data Fetcher

FIO REST API 数据自动获取工具，支持 GitHub Actions 自动化运行。

## 功能特性

- 安全连接 FIO 数据源（无需认证）
- 获取所有公开可访问的数据端点
- 数据类型验证
- 数据标准化格式化处理
- 全量更新机制
- 完善的错误处理与日志记录

## 项目结构

```
fiodata/
├── src/
│   ├── modules/
│   │   ├── apiClient.js    # API 客户端
│   │   ├── logger.js       # 日志模块
│   │   ├── storage.js       # 数据存储模块
│   │   └── validator.js     # 数据验证模块
│   └── index.js             # 主入口
├── tests/
│   └── modules.test.js      # 单元测试
├── data/                    # 数据存储目录
├── logs/                    # 日志目录
├── .github/workflows/
│   └── fetch.yml            # GitHub Actions 工作流
├── package.json
└── README.md
```

## API 端点

### JSON 端点 (7个)

| 端点名称 | API 路径 | 描述 |
|---------|----------|------|
| buildings | `/building/allbuildings` | 所有建筑信息 |
| materials | `/material/allmaterials` | 所有材料信息 |
| planets | `/planet/allplanets` | 所有星球信息 |
| systemstars_allstars | `/systemstars/allstars` | 恒星系统信息 |
| exchange_all | `/exchange/all` | 交易所摘要信息 |
| exchange_full | `/exchange/full` | 交易所完整信息 |
| chat_list | `/chat/list` | 聊天频道列表 |

### CSV 端点 (21个)

| 端点名称 | API 路径 | 描述 |
|---------|----------|------|
| csv_buildings | `/csv/buildings` | 建筑信息 |
| csv_buildingcosts | `/csv/buildingcosts` | 建筑成本 |
| csv_buildingworkforces | `/csv/buildingworkforces` | 建筑劳动力 |
| csv_buildingrecipes | `/csv/buildingrecipes` | 建筑配方 |
| csv_materials | `/csv/materials` | 材料信息 |
| csv_prices | `/csv/prices` | 价格信息 |
| csv_prices_condensed | `/csv/prices/condensed` | 价格信息(精简版) |
| csv_orders | `/csv/orders` | 订单信息 |
| csv_bids | `/csv/bids` | 竞价信息 |
| csv_recipeinputs | `/csv/recipeinputs` | 配方输入 |
| csv_recipeoutputs | `/csv/recipeoutputs` | 配方输出 |
| csv_planets | `/csv/planets` | 星球信息 |
| csv_planetresources | `/csv/planetresources` | 星球资源 |
| csv_planetproductionfees | `/csv/planetproductionfees` | 星球生产费用 |
| csv_planetdetail | `/csv/planetdetail` | 星球详情 |
| csv_systems | `/csv/systems` | 系统信息 |
| csv_systemlinks | `/csv/systemlinks` | 系统链接 |
| csv_systemplanets | `/csv/systemplanets` | 系统星球 |
| csv_infrastructure_allreports | `/csv/infrastructure/allreports` | 基础设施报告 |
| csv_infrastructure_allinfos | `/csv/infrastructure/allinfos` | 基础设施信息 |

## 数据格式

### JSON 数据示例

**buildings.json**
```json
[
  {
    "BuildingId": "...",
    "Name": "rig",
    "Ticker": "RIG",
    "Expertise": "RESOURCE_EXTRACTION",
    "Pioneers": 5,
    "Settlers": 0,
    ...
  }
]
```

**exchange_all.json**
```json
[
  {
    "MaterialTicker": "AAR",
    "ExchangeCode": "AI1",
    "PriceAverage": 16048.03,
    "AskCount": 12,
    "Ask": 15900,
    "Supply": 808,
    "BidCount": 55,
    "Bid": 15000,
    "Demand": 55
  }
]
```

**chat_list.json**
```json
[
  {
    "DisplayName": "Aceland Global Site Owners",
    "ChannelId": "a6a7cd7129b496b3bd84c1f372bd06a7",
    "NaturalId": null
  }
]
```

### CSV 数据示例

**csv_systemlinks.csv** (系统链接)
```csv
Left,Right
AJ-120,AJ-135
AJ-120,AJ-505
AJ-293,AJ-575
```

**csv_prices.csv** (价格信息)
```csv
Ticker,MMBuy,MMSell,AI1-Average,AI1-AskAmt,AI1-AskPrice,...
AAR,,,16048.03,12,15900,808,55,15000,55,...
```

## 运行说明

### 本地运行

```bash
npm install
npm start
```

### 运行测试

```bash
npm test
```

## GitHub Actions

工作流配置：
- **定时执行**：每 5 分钟运行一次
- **手动触发**：通过 workflow_dispatch 可手动执行
- **自动提交**：检测到数据变化时自动提交到仓库

## 数据统计

| 数据集 | 记录数 | 大小 |
|--------|--------|------|
| buildings | 88 | 515 KB |
| materials | 370 | 126 KB |
| planets | 4,576 | 325 KB |
| systemstars_allstars | 698 | 325 KB |
| exchange_all | 2,214 | 539 KB |
| exchange_full | 2,214 | 6.9 MB |
| chat_list | 705 | 94 KB |
| csv_infrastructure_allreports | - | 24.7 MB |
| csv_infrastructure_allinfos | - | 21.9 MB |

## 故障排除

### 常见问题

1. **请求超时**
   - 网络连接不稳定
   - API 服务器负载高
   - 脚本会自动重试 3 次

2. **端点返回 400/404 错误**
   - 端点路径可能已更改
   - 端点可能需要认证

### 查看日志

日志文件位于 `logs/` 目录，按日期命名：
```bash
tail -f logs/fio_fetch_2026-03-27.log
```

## 许可证

MIT
