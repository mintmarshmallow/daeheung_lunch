'use strict';

var express = require('express');
var app = express();
var logger = require('morgan');
var bodyParser = require('body-parser');
var sanitizeHtml = require('sanitize-html');
var request = require('request');
var cheerio = require('cheerio');
var v = require('voca');
var moment = require('moment');

require('moment-timezone');
app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
moment.tz.setDefault("Asia/Seoul");
function getDate(dayplus) {
  var date = moment().add(dayplus, "days").format('M D').split(" ");
  var now_obj = {
    month: parseInt(date[0]),
    day: parseInt(date[1])
  };
  return now_obj;
}
url = 'https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%ED%8F%AC%ED%95%AD%EB%8C%80%ED%9D%A5%EC%A4%91%EA%B8%89%EC%8B%9D';

function getLunch(req, res, allergy, date, message /*callback*/) {
  request({ url: url }, function (err, res_lunch, body) {
    var correct_lunch = void 0;
    var $ = cheerio.load(body, { decodeEntities: true });
    var $each_menu_info = $('div.school_menu._page_panel ul');
    var lunches = [];
    $each_menu_info.find('li.menu_info').each(function (index, elem) {
      var date_in_strong = $(this).find('strong').text();

      var date_string = v.trim(date_in_strong);
      var date_month_and_day = date_in_strong.replace("월", "").replace("일", "").split(" ");
      var lunch = "";
      $(this).find('ul li').each(function (index, elem) {
        each_lunch_menu = v.trim($(this).text());
        lunch = lunch + each_lunch_menu + "\n";
      });
      var lunch_with_date = {
        menu: lunch,
        date: {
          month: parseInt(date_month_and_day[0]),
          day: parseInt(date_month_and_day[1])
        }
      };
      lunches.push(lunch_with_date);
    });

    for (lunch in lunches) {

      if (lunches[lunch].date.month === date.month && lunches[lunch].date.day === date.day) {
        correct_lunch = lunches[lunch];
        break;
      }
    }

    if (correct_lunch !== undefined) {
      lunch_str = (message ? message : "") + ('\n' + correct_lunch.date.month + '\uC6D4 ' + correct_lunch.date.day + '\uC77C \uAE09\uC2DD:\n' + correct_lunch.menu);
    } else {
      lunch_str = (message ? message : "") + "\n죄송합니다. 해당하는 날짜의 급식을 불러 오지 못했습니다.";
    }

    //callback(lunch_str)
    var responseBody = {
      version: "2.0",
      template: {
        data: { text: lunch_str },
        outputs: [{
          simpleText: {
            text: lunch_str
          }
        }]
      }
    };
    res.status(200).send(responseBody);

    /*const content = sanitizeHtml(lunches, {
      parser: {
        decodeEntities: true
      }
    });*/

    //console.log(content);
  });
}

var apiRouter = express.Router();

app.use('/api', apiRouter);
app.get('/', function (req, res) {
  console.log('app.get is working');
  res.send('Hello World');
});

apiRouter.post('/eunha', function (req, res) {
  console.log(req.body);

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
  if (req.body.action) {
    var action_info = req.body.action.params; //.forEach((value, key, mapObject) => console.log(key +' , ' +value));

    action_info = JSON.parse(action_info.sys_date);
    var allergy_info = req.body.action.알러지정보;
    console.log(allergy_info);
    switch (action_info.dateTag) {
      case "today":
        console.log("today");date = getLunch(req, res, allergy_info, getDate(0));break;
      case "tomorrow":
        date = getLunch(req, res, allergy_info, getDate(1));break;
      case "yesterday":
        date = getLunch(req, res, allergy_info, getDate(-1));break;
      case null:
        if (action_info.month && action_info.day) {
          var _date = {
            month: parseInt(action_info.month),
            day: parseInt(action_info.day)
          };
          getLunch(req, res, allergy_info, _date);
          break;
        }
        break;
      default:
        getLunch(req, res, allergy_info, getDate(0), "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.");
    }
  } else {
    getLunch(req, res, null, getDate(0), "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.");
  }

  console.log('todayLunch is working');
});

/*app.listen(1337, function() {
  console.log('Example skill server listening on port 3000!');
});*/
port = 8001;
app.listen(process.env.PORT || port);