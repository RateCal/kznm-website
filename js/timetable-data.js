// js/timetable-data.js
// eるりきゅう 時刻表管理システム 出力 2026/2/28 16:49:50
// ※ 手動編集より管理システム (admin.html) の使用を推奨します。

const TIMETABLE = {
  "trains": [
    {
      "id": "train-1772197348775",
      "type": "special-rapid",
      "name": "田所 810号",
      "runDays": [
        "2026-02-27",
        "2026-02-28"
      ],
      "stops": [
        {
          "code": "A1",
          "arr": null,
          "dep": "08:10"
        },
        {
          "code": "C1",
          "arr": "19:19",
          "dep": null
        }
      ],
      "notice": "下北沢へは参りませんので、ご注意ください。",
      "trainNo": "9810A",
      "cars": [
        {
          "carNo": 1,
          "seatClass": "general",
          "seats": 16,
          "note": ""
        },
        {
          "carNo": 2,
          "seatClass": "general",
          "seats": 16,
          "note": ""
        },
        {
          "carNo": 3,
          "seatClass": "general",
          "seats": 16,
          "note": ""
        },
        {
          "carNo": 4,
          "seatClass": "reserved",
          "seats": 16,
          "note": "車内は禁煙です。喫煙室をご利用ください。"
        }
      ],
      "reserveOpen": true
    },
    {
      "id": "train-1772262134376",
      "type": "charter",
      "trainNo": "9951",
      "name": "修学旅行",
      "runDays": [],
      "notice": "",
      "charterPass": "0050",
      "cars": [],
      "stops": [
        {
          "code": "X01",
          "arr": null,
          "dep": "08:45"
        },
        {
          "code": "Y02",
          "arr": "09:13",
          "dep": null
        }
      ]
    }
  ]
};
