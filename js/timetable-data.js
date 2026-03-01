// js/timetable-data.js
// eるりきゅう 時刻表管理システム 出力 2026/3/1 17:15:33
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
      "reserveOpen": false
    },
    {
      "id": "train-1772262134376",
      "type": "charter",
      "trainNo": "9951",
      "name": "修学旅行",
      "runDays": [
        "2026-03-01"
      ],
      "notice": "",
      "charterPass": "0050",
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
          "seatClass": "special",
          "seats": 16,
          "note": ""
        }
      ],
      "stops": [
        {
          "code": "Y02",
          "arr": null,
          "dep": "08:45"
        },
        {
          "code": "Y01",
          "arr": "09:13",
          "dep": null
        },
        {
          "code": "A1",
          "arr": "09:36",
          "dep": "09:38"
        },
        {
          "code": "A4",
          "arr": "10:09",
          "dep": "10:11"
        },
        {
          "code": "B3",
          "arr": "10:28",
          "dep": "10:31"
        },
        {
          "code": "B4",
          "arr": "10:50",
          "dep": null
        }
      ],
      "reserveOpen": true
    },
    {
      "id": "train-1772352469901",
      "type": "rapid",
      "trainNo": "",
      "name": "",
      "runDays": "daily",
      "notice": "",
      "charterPass": "",
      "reserveOpen": false,
      "cars": [],
      "stops": []
    }
  ]
};
