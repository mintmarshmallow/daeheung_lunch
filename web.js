"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

require("moment-timezone");

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _morgan = require("morgan");

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

_moment2.default.tz.setDefault("Asia/Seoul");
app.use((0, _morgan2.default)('dev', {}));
app.use(_bodyParser2.default.json());
var getNoticeAndLetter = async function getNoticeAndLetter(group) {
  var groupNum = void 0;
  if (group === "notice") {
    groupNum = '2068028';
  } else if (group === "letter") {
    groupNum = '2068029';
  }
  try {
    var content = await _axios2.default.get("https://school.iamservice.net/api/article/organization/16777/group/" + groupNum + "?next_token=0");
    console.log(content.data + '\n\n\n\n\n\n\n');
    console.log(content.article);
    if (!content.data.articles.length) return null;
    return content;
  } catch (error) {
    console.error(error);
    return null;
  }
};
var sendNoticeAndLetter = async function sendNoticeAndLetter() {
  var group = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "notice";
  var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
  var res = arguments[2];

  var content = await getNoticeAndLetter(group);
  if (!content) {
    res.status(200).send("");
  }
  var final = content.data.articles.slice(0, limit).map(function (value) {
    return "\uB300\uD765\uC911\uD559\uAD50 " + value.group_name + "\n\uC81C\uBAA9: " + value.title + "   \uC791\uC131\uC790:" + value.author + "\n" + value.content + "\n " + value.files.map(function (value) {
      return value.title + "\n" + value.url + "\n";
    }) + " \uCD5C\uC885 \uC5C5\uB370\uC774\uD2B8: " + value.updated_at;
  });
  var finalText = "";
  final.map(function (value) {
    return finalText = finalText + value + "\n\n\n\n\n\n";
  });
  var responseBody = {
    version: "2.0",
    template: {
      data: { text: group },
      outputs: [{
        simpleText: {
          text: finalText
        }
      }]
    }
  };
  res.status(200).send(responseBody);
};
var getDate = function getDate(dayPlus) {
  var currentDate_arr = (0, _moment2.default)().add(dayPlus, 'days').format('YYYY MM DD').split(" ");
  var currentDate_obj = {
    year: parseInt(currentDate_arr[0]),
    month: parseInt(currentDate_arr[1]),
    day: parseInt(currentDate_arr[2])
  };
  return currentDate_obj;
};

var getLunch = async function getLunch(count, schoolInfo) {
  var url = void 0;
  switch (schoolInfo.schoolName) {
    case "pohang-daeheung-middle":
      url = "https://school.iamservice.net/api/article/organization/16777/group/2068031?next_token=";
      break;
    case "pohang-joongang-high":
      url = "https://school.iamservice.net/api/article/organization/16086/group/2062519?next_token=";
      break;
    default:
      console.log("Can not find schoolName");
      throw new Error("Can not find schoolName");
  }
  try {
    var currentLunches = await _axios2.default.get(url + String(count));
    if (!currentLunches.data.articles.length) return null;
    return currentLunches;
  } catch (error) {
    console.error(error);
    return null;
  }
};
var getTodayLunch = async function getTodayLunch(count) {
  var currentDate_obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var schoolInfo = arguments[2];
  var todayLimit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var finalLunch = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

  console.log(count);
  var lunches = await getLunch(count, schoolInfo);
  if (lunches === null) {
    console.log("?????");
    return "급식을 불러오지 못했습니다.";
  }
  var lunches_with_date = lunches.data.articles.map(function (lunch, index, arr) {
    var menu = "";
    lunch.content.split(" ").map(function (each_menu, index, arr) {
      menu = menu + each_menu + "\n";
    });
    var date_arr = lunch.local_date_of_pub_date.split(".");

    var lunch_with_date = {
      date: {
        year: parseInt(date_arr[0]),
        month: parseInt(date_arr[1]),
        day: parseInt(date_arr[2])
      },
      menu: menu,
      kind: lunch.author

    };
    return lunch_with_date;
  });
  var last_date = void 0;
  // todayLimit 오늘 급식은 중식, 석식 두 가지 둘 다 불러오려면 해당 변수 필요함
  //3개의 급식을 불러오기 위해 request를 1번 더 보내야 하는 경우도 생길 수 있으므로 추후 리팩토링 요구
  for (var i in lunches_with_date) {
    var lunch = lunches_with_date[i];
    if (todayLimit === 0) {
      if (lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day) {
        finalLunch.push(lunch);
        console.log(finalLunch);
        todayLimit++;
      }
    } else if (todayLimit === 1) {
      if (lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day) {
        finalLunch.push(lunch);
        console.log(finalLunch);
      }
      todayLimit++;
    } else if (todayLimit === 2) {
      if (lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day) {
        finalLunch.push(lunch);
        console.log(finalLunch);
      }
      todayLimit++;
    } else if (todayLimit === 3) {
      var finalString = void 0;
      for (var _lunch in finalLunch) {
        finalString += _lunch.menu + "\n" + String(_lunch.date.year) + "년 " + String(_lunch.date.month) + "월 " + String(_lunch.date.day) + "일" + (_lunch.kind + " \uC785\uB2C8\uB2E4.\n\n");
      }
      return finalString;
    }
  }
  last_date = lunches_with_date[i].date;
  console.log("last date");
  if (last_date.year < currentDate_obj.year) {
    console.log("nothing same");
    return "해당 날짜의 급식을 불러오지 못했습니다.";
  } else if (last_date.year === currentDate_obj.year && last_date.month < currentDate_obj.month) {
    console.log("year same");
    return "해당 날짜의 급식을 불러오지 못했습니다.";
  } else if (last_date.year === currentDate_obj.year && last_date.month === currentDate_obj.month && last_date.day < currentDate_obj.day) {
    console.log("month same");
    return "해당 날짜의 급식을 불러오지 못했습니다.";
  }

  var final = await getTodayLunch(count + 20, currentDate_obj, schoolInfo, todayLimit, finalLunch);
  return final;
};
var sendLunch = async function sendLunch() {
  var currentDate_obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var res = arguments[1];
  var schoolInfo = arguments[2];
  var msg = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";

  var result = await getTodayLunch(0, currentDate_obj, schoolInfo);
  var responseBody = {
    version: "2.0",
    template: {
      data: { text: "급식" },
      outputs: [{
        simpleText: {
          text: msg + "\n" + result
        }
      }]
    }
  };
  res.status(200).send(responseBody);
};

var apiRouter = _express2.default.Router();

app.use('/api', apiRouter);
app.get('/', function (req, res) {
  console.log('app.get is working');
  res.send('Hello World');
});

apiRouter.post('/notice', function (req, res) {
  sendNoticeAndLetter("notice", 3, res);
});
apiRouter.post('/letter', function (req, res) {
  sendNoticeAndLetter("letter", 3, res);
});

apiRouter.post('/eunha', function (req, res) {

  var responseBody = {
    version: "2.0",
    template: {
      outputs: [{
        simpleImage: {
          imageUrl: "http://file3.instiz.net/data/cached_img/upload/2018/10/08/14/dc2103bba5d149d7a689bdaf39787a79.jpg",
          altText: "은하야 넘 이쁘다. ㅠㅠㅠ"
        }
      }]
    }
  };

  res.status(200).send(responseBody);
});
apiRouter.post('/todayLunch', function (req, res) {
  var schoolName = req.header("schoolName");
  var schoolKind = req.header("schoolKind");
  console.log(schoolName);
  var schoolInfo = {
    schoolName: schoolName,
    schoolKind: schoolKind
  };
  if (req.body.action) {
    var action_info = req.body.action.params; //.forEach((value, key, mapObject) => console.log(key +' , ' +value));

    action_info = JSON.parse(action_info.sys_date);
    //let allergy_info = req.body.action.알러지정보
    //console.log(allergy_info)
    switch (action_info.dateTag) {
      case "today":
        console.log("today");sendLunch(getDate(0), res, schoolInfo);break;
      case "tomorrow":
        sendLunch(getDate(1), res, schoolInfo);break;
      case "yesterday":
        sendLunch(getDate(-1), res, schoolInfo);break;
      case null:
        if (action_info.month && action_info.day) {
          if (action_info.year === null) {
            var date = {
              year: getDate(0).year,
              month: parseInt(action_info.month),
              day: parseInt(action_info.day)
            };
            sendLunch(date, res, schoolInfo);
            break;
          } else {
            var _date = {
              year: parseInt(action_info.year),
              month: parseInt(action_info.month),
              day: parseInt(action_info.day)
            };
            sendLunch(_date, res, schoolInfo);
            break;
          }
        }
        break;
      default:
        sendLunch(getDate(0), res, schoolInfo, "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.");
    }
  } else {
    sendLunch(getDate(0), res, schoolInfo, "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.");
  }
  console.log('todayLunch is working');
});

/*app.listen(1337, function() {
  console.log('Example skill server listening on port 3000!');
});*/
var port = 8001;
app.listen(process.env.PORT || port);