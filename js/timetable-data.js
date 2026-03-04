// js/timetable-data.js
// eるりきゅう 時刻表管理システム 出力 2026/3/4 16:37:26
// ※ 手動編集より管理システム (admin.html) の使用を推奨します。

const TIMETABLE = {
  "trains": [
    {
      "id": "train-1772608642596",
      "type": "holiday-rapid",
      "trainNo": "B0591",
      "name": "快速 ゆきみ野 1号",
      "runDays": "weekend",
      "notice": "",
      "charterPass": "",
      "reserveOpen": false,
      "cars": [
        {
          "carNo": 1,
          "seatClass": "free",
          "seats": 56,
          "note": "喫煙可能"
        },
        {
          "carNo": 2,
          "seatClass": "reserved",
          "seats": 56,
          "note": "禁煙"
        },
        {
          "carNo": 3,
          "seatClass": "reserved",
          "seats": 51,
          "note": "禁煙"
        }
      ],
      "stops": [
        {
          "code": "X01",
          "arr": null,
          "dep": "09:13"
        },
        {
          "code": "C1",
          "arr": "09:17",
          "dep": "09:18"
        },
        {
          "code": "A1",
          "arr": "09:25",
          "dep": "09:27"
        },
        {
          "code": "A4",
          "arr": "09:32",
          "dep": "09:34"
        },
        {
          "code": "A5",
          "arr": "09:39",
          "dep": "09:41"
        },
        {
          "code": "A6",
          "arr": "09:44",
          "dep": "09:45"
        },
        {
          "code": "A8",
          "arr": "09:51",
          "dep": "09:52"
        },
        {
          "code": "A7",
          "arr": "09:56",
          "dep": null
        }
      ]
    },
    {
      "id": "train-1772609302698",
      "type": "holiday-rapid",
      "trainNo": "C0593",
      "name": "快速 ゆきみ野 3号",
      "runDays": "weekend",
      "notice": "",
      "charterPass": "",
      "reserveOpen": false,
      "cars": [
        {
          "carNo": 1,
          "seatClass": "free",
          "seats": 56,
          "note": "喫煙可能"
        },
        {
          "carNo": 2,
          "seatClass": "reserved",
          "seats": 56,
          "note": "禁煙"
        },
        {
          "carNo": 3,
          "seatClass": "reserved",
          "seats": 51,
          "note": "禁煙"
        }
      ],
      "stops": [
        {
          "code": "Y02",
          "arr": null,
          "dep": "09:48"
        },
        {
          "code": "Y01",
          "arr": "09:55",
          "dep": "10:03"
        },
        {
          "code": "C1",
          "arr": "10:17",
          "dep": "10:18"
        },
        {
          "code": "A1",
          "arr": "10:25",
          "dep": "10:27"
        },
        {
          "code": "A4",
          "arr": "10:32",
          "dep": "10:34"
        },
        {
          "code": "A5",
          "arr": "10:39",
          "dep": "10:41"
        },
        {
          "code": "A6",
          "arr": "10:44",
          "dep": "10:45"
        },
        {
          "code": "A8",
          "arr": "10:51",
          "dep": "10:52"
        },
        {
          "code": "A7",
          "arr": "10:57",
          "dep": null
        }
      ]
    },
    {
      "id": "train-1772609437981",
      "type": "holiday-rapid",
      "trainNo": "A0592V",
      "name": "快速 ゆきみ野 2号（通常運転）",
      "runDays": "weekend",
      "notice": "",
      "charterPass": "",
      "reserveOpen": false,
      "cars": [
        {
          "carNo": 1,
          "seatClass": "free",
          "seats": 56,
          "note": "喫煙可能"
        },
        {
          "carNo": 2,
          "seatClass": "reserved",
          "seats": 56,
          "note": "禁煙"
        },
        {
          "carNo": 3,
          "seatClass": "reserved",
          "seats": 51,
          "note": "禁煙"
        }
      ],
      "stops": [
        {
          "code": "A7",
          "arr": "09:51",
          "dep": "17:38"
        },
        {
          "code": "A8",
          "arr": "17:45",
          "dep": "16:48"
        },
        {
          "code": "A6",
          "arr": "17:55",
          "dep": "18:01"
        },
        {
          "code": "A5",
          "arr": "18:05",
          "dep": "18:06"
        },
        {
          "code": "A1",
          "arr": "18:22",
          "dep": "18:24"
        },
        {
          "code": "C1",
          "arr": "18:27",
          "dep": null
        }
      ]
    },
    {
      "id": "train-1772609632980",
      "type": "holiday-rapid",
      "trainNo": "A0592V",
      "name": "快速 ゆきみ野 2号（延長運転）",
      "runDays": "weekend",
      "notice": "",
      "charterPass": "",
      "reserveOpen": true,
      "cars": [
        {
          "carNo": 4,
          "seatClass": "free",
          "seats": 56,
          "note": "喫煙可能"
        },
        {
          "carNo": 5,
          "seatClass": "reserved",
          "seats": 56,
          "note": "禁煙"
        },
        {
          "carNo": 6,
          "seatClass": "reserved",
          "seats": 51,
          "note": "禁煙"
        }
      ],
      "stops": [
        {
          "code": "A7",
          "arr": "09:51",
          "dep": "17:38"
        },
        {
          "code": "A8",
          "arr": "17:45",
          "dep": "16:48"
        },
        {
          "code": "A6",
          "arr": "17:55",
          "dep": "18:01"
        },
        {
          "code": "A5",
          "arr": "18:05",
          "dep": "18:06"
        },
        {
          "code": "A1",
          "arr": "18:22",
          "dep": "18:24"
        },
        {
          "code": "C1",
          "arr": "18:27",
          "dep": "18:31"
        },
        {
          "code": "Y01",
          "arr": "18:37",
          "dep": "18:39"
        },
        {
          "code": "Y02",
          "arr": "18:43",
          "dep": null
        }
      ]
    }
  ]
};
