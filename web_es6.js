import express from "express"
const app = express();
import moment from "moment"
import 'moment-timezone';
import axios from "axios"
moment.tz.setDefault("Asia/Seoul");
const getDate = (dayPlus) => {
    let currentDate_arr = moment().add(dayPlus, 'days').format('YYYY MM DD').split(" ");
    let currentDate_obj = {
        year: parseInt(currentDate_arr[0]),
        month: parseInt(currentDate_arr[1]),
        day: parseInt(currentDate_arr[2])
    }
    return currentDate_obj
}
const getLunch = async (count) => {
  try {
    const currentLunches =  await axios.get(`https://school.iamservice.net/api/article/organization/16777/group/2068031?next_token=${String(count)}`);
    return currentLunches
  } catch (error) {
    console.error(error);
    return null
  }
};
const getTodayLunch = async (count, currentDate_obj = 0) => {
  let finalLunch;
  let lunches = await getLunch(count);
  if(lunches === null) return "오늘 급식을 불러오지 못했습니다."
  let lunches_with_date = lunches.data.articles.map((lunch, index, arr) => {
      let menu = "";
      lunch.content.split(" ").map((each_menu, index, arr) => {
        menu = menu + each_menu + "\n"
      })
      let date_arr = lunch.local_date_of_pub_date.split(".");

      let lunch_with_date = {
        date:{
            year: parseInt(date_arr[0]),
            month: parseInt(date_arr[1]),
            day: parseInt(date_arr[2])
        },
        menu:menu

      }
      return lunch_with_date
  })
  let last_date;
  for(let i in lunches_with_date){
      let lunch = lunches_with_date[i]
    if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
        finalLunch = lunch.menu;
        console.log(finalLunch)
        return finalLunch+String(lunch.date.year)+"년 " + String(lunch.date.month) + "월 " + String(lunch.date.day) +"일 급식 입니다."
    }

    last_date = lunches_with_date[i].date
  }
if(last_date.year < currentDate_obj.year){
    console.log("nothing same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
} else if(last_date.year === currentDate_obj.year && last_date.month < currentDate_obj.month){
    console.log("year same")
    return "해당 날짜의 오늘 급식을 불러오지 못했습니다."
} else if(last_date.year === currentDate_obj.year && last_date.month === currentDate_obj.month && last_date.day < currentDate_obj.day){
    console.log("month same")
    return "해당 날짜의 오늘 급식을 불러오지 못했습니다."
}

  return await getTodayLunch(count+20)
}
const sendLunch = async(currentDate_obj = 0, res, msg = "") => {
  let result = await getTodayLunch(0, currentDate_obj);
  const responseBody = {
      version: "2.0",
      template: {
        data:{text:"급식"},
        outputs: [
          {
            simpleText: {
              text: msg + "\n" + result
            }
          }
        ]
      }
    };
  res.status(200).send(responseBody);
}

const apiRouter = express.Router();

app.use('/api', apiRouter);
app.get('/', function(req, res){
    console.log('app.get is working')
    res.send('Hello World');
})

apiRouter.post('/eunha', function(req, res) {
  console.log(req.body);
  
  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleImage: {
            imageUrl: "http://file3.instiz.net/data/cached_img/upload/2018/10/08/14/dc2103bba5d149d7a689bdaf39787a79.jpg",
            altText: "은하야 넘 이쁘다. ㅠㅠㅠ"
          }
        }
      ]
    }
  };

  res.status(200).send(responseBody);
});
apiRouter.post('/todayLunch', function(req, res) {
  try {
    let action_info = req.body.action.params//.forEach((value, key, mapObject) => console.log(key +' , ' +value));
    
    action_info = JSON.parse(action_info.sys_date)
    let allergy_info = req.body.action.알러지정보
    console.log(allergy_info)
    switch(action_info.dateTag){
      case "today": console.log("today"); sendLunch(getDate(0)); break;
      case "tomorrow": sendLunch(getDate(1), res); break;
      case "yesterday": sendLunch(getDate(-1), res); break;
      case null: if(action_info.month && action_info.day){
        if(action_info.year === null){
          let date = {
            year: getDate(0).year,
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res);
          break;
        } else {
          let date = {
            year: parseInt(action_info.year),
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res);
          break;
        }
      }
      break;
      default: sendLunch(getDate(0),res,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.") 
    }
  } catch(error) {
    sendLunch(getDate(0),res,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.")
  }
  console.log('todayLunch is working')
});


/*app.listen(1337, function() {
  console.log('Example skill server listening on port 3000!');
});*/
const port = 8001
app.listen(process.env.PORT || port)