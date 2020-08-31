<<<<<<< HEAD
import express from "express"
const app = express();
import moment from "moment"
import 'moment-timezone';
import axios from "axios";
import logger from 'morgan';
import bodyParser from'body-parser';
moment.tz.setDefault("Asia/Seoul");
app.use(logger('dev', {}));
app.use(bodyParser.json());
const getNoticeAndLetter = async (group) => {
  let groupNum;
  if(group === "notice") {
    groupNum = '2068028';
  } else if(group === "letter"){
    groupNum = '2068029';
  }
  try {
    const content =  await axios.get(`https://school.iamservice.net/api/article/organization/16777/group/${groupNum}?next_token=0`);
    console.log(content.data+'\n\n\n\n\n\n\n');
    console.log(content.article);
    if(!content.data.articles.length) return null
    return content
  } catch (error) {
    console.error(error);
    return null
  }
}
const sendNoticeAndLetter = async (group = "notice",limit=3,  res) => {
  const content = await getNoticeAndLetter(group);
  if(!content) {
    res.status(200).send("")
  }
  let final = content.data.articles.slice(0, limit).map((value) => {
    return `대흥중학교 ${value.group_name}\n제목: ${value.title}   작성자:${value.author}\n${value.content}\n ${value.files.map((value) => value.title +"\n"+ value.url+"\n")} 최종 업데이트: ${value.updated_at}`
  });
  let finalText = "";
  final.map((value) => finalText = finalText + value + "\n\n\n\n\n\n")
  const responseBody = {
    version: "2.0",
    template: {
      data:{text:group},
      outputs: [
        {
          simpleText: {
            text: finalText
          }
        }
      ]
    }
  };
  res.status(200).send(responseBody)
}
const getDate = (dayPlus) => {
    let currentDate_arr = moment().add(dayPlus, 'days').format('YYYY MM DD').split(" ");
    let currentDate_obj = {
        year: parseInt(currentDate_arr[0]),
        month: parseInt(currentDate_arr[1]),
        day: parseInt(currentDate_arr[2])
    }
    return currentDate_obj
}

const getLunch = async (count, schoolInfo) => {
  let url;
  switch(schoolInfo.schoolName) {
    case "pohang-daeheung-middle":
      url = "https://school.iamservice.net/api/article/organization/16777/group/2068031?next_token="
      break;
    case "pohang-joongang-high":
      url = "https://school.iamservice.net/api/article/organization/16086/group/2062519?next_token="
      break;
    default:
      console.log("Can not find schoolName")
      throw new Error("Can not find schoolName");
  }
  try {
    const currentLunches =  await axios.get(url+String(count));
    if(!currentLunches.data.articles.length) return null
    return currentLunches
  } catch (error) {
    console.error(error);
    return null
  }
};
const getTodayLunch = async (count, currentDate_obj = 0, schoolInfo, todayLimit=0, finalLunch=[]) => {
  console.log(count)
  let lunches = await getLunch(count, schoolInfo);
  if(lunches === null){
    console.log("?????");
    return "급식을 불러오지 못했습니다."
  }
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
        menu:menu,
        kind: lunch.author

      }
      return lunch_with_date
  })
  let last_date;
  // todayLimit 오늘 급식은 중식, 석식 두 가지 둘 다 불러오려면 해당 변수 필요함
  //3개의 급식을 불러오기 위해 request를 1번 더 보내야 하는 경우도 생길 수 있으므로 추후 리팩토링 요구
  for(var i in lunches_with_date){
      let lunch = lunches_with_date[i];
      if(todayLimit === 0){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch)
          todayLimit++;       
        }
      } else if(todayLimit === 1){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch);
        }
        todayLimit++
      } else if(todayLimit === 2){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch);
        }
        todayLimit++
      }else if(todayLimit === 3){
        let finalString = "";
        finalLunch = finalLunch.reverse();
        for(let i in finalLunch){
          finalString += finalLunch[i].menu+"\n"+String(finalLunch[i].date.year)+"년 " + String(finalLunch[i].date.month) + "월 " + String(finalLunch[i].date.day) +"일"+ `${finalLunch[i].kind} 입니다.\n\n`
        }
        return finalString;
      } 
  }
  last_date = lunches_with_date[i].date
  console.log("last date")
  if(last_date.year < currentDate_obj.year){
    console.log("nothing same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
  } else if(last_date.year === currentDate_obj.year && last_date.month < currentDate_obj.month){
    console.log("year same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
  } else if(last_date.year === currentDate_obj.year && last_date.month === currentDate_obj.month && last_date.day < currentDate_obj.day){
    console.log("month same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
}

  let final =  await getTodayLunch(count+20, currentDate_obj, schoolInfo, todayLimit, finalLunch);
  return final;
}
const sendLunch = async(currentDate_obj = 0, res, schoolInfo,  msg = "") => {
  let result = await getTodayLunch(0, currentDate_obj, schoolInfo);
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

apiRouter.post('/notice', function(req, res){
  sendNoticeAndLetter("notice", 3, res)
})
apiRouter.post('/letter', function(req, res){
  sendNoticeAndLetter("letter", 3, res)
})

apiRouter.post('/eunha', function(req, res) {
  
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
  const schoolName = req.header("schoolName");
  const schoolKind = req.header("schoolKind");
  console.log(schoolName)
  const schoolInfo = {
    schoolName,
    schoolKind
  }
  if(req.body.action){
    let action_info = req.body.action.params//.forEach((value, key, mapObject) => console.log(key +' , ' +value));
    
    action_info = JSON.parse(action_info.sys_date)
    //let allergy_info = req.body.action.알러지정보
    //console.log(allergy_info)
    switch(action_info.dateTag){
      case "today": console.log("today"); sendLunch(getDate(0), res, schoolInfo); break;
      case "tomorrow": sendLunch(getDate(1), res, schoolInfo); break;
      case "yesterday": sendLunch(getDate(-1), res, schoolInfo); break;
      case null: if(action_info.month && action_info.day){
        if(action_info.year === null){
          let date = {
            year: getDate(0).year,
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res, schoolInfo);
          break;
        } else {
          let date = {
            year: parseInt(action_info.year),
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res, schoolInfo);
          break;
        }
      }
      break;
      default: sendLunch(getDate(0),res, schoolInfo,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.") 
    }
  } else{
    sendLunch(getDate(0),res, schoolInfo,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.")
  }
  console.log('todayLunch is working')
});


/*app.listen(1337, function() {
  console.log('Example skill server listening on port 3000!');
});*/
const port = 8001
app.listen(process.env.PORT || port)

=======
import express from "express"
const app = express();
import moment from "moment"
import 'moment-timezone';
import axios from "axios";
import logger from 'morgan';
import bodyParser from'body-parser';
moment.tz.setDefault("Asia/Seoul");
app.use(logger('dev', {}));
app.use(bodyParser.json());
const getNoticeAndLetter = async (group) => {
  let groupNum;
  if(group === "notice") {
    groupNum = '2068028';
  } else if(group === "letter"){
    groupNum = '2068029';
  }
  try {
    const content =  await axios.get(`https://school.iamservice.net/api/article/organization/16777/group/${groupNum}?next_token=0`);
    console.log(content.data+'\n\n\n\n\n\n\n');
    console.log(content.article);
    if(!content.data.articles.length) return null
    return content
  } catch (error) {
    console.error(error);
    return null
  }
}
const sendNoticeAndLetter = async (group = "notice",limit=3,  res) => {
  const content = await getNoticeAndLetter(group);
  if(!content) {
    res.status(200).send("")
  }
  let final = content.data.articles.slice(0, limit).map((value) => {
    return `대흥중학교 ${value.group_name}\n제목: ${value.title}   작성자:${value.author}\n${value.content}\n ${value.files.map((value) => value.title +"\n"+ value.url+"\n")} 최종 업데이트: ${value.updated_at}`
  });
  let finalText = "";
  final.map((value) => finalText = finalText + value + "\n\n\n\n\n\n")
  const responseBody = {
    version: "2.0",
    template: {
      data:{text:group},
      outputs: [
        {
          simpleText: {
            text: finalText
          }
        }
      ]
    }
  };
  res.status(200).send(responseBody)
}
const getDate = (dayPlus) => {
    let currentDate_arr = moment().add(dayPlus, 'days').format('YYYY MM DD').split(" ");
    let currentDate_obj = {
        year: parseInt(currentDate_arr[0]),
        month: parseInt(currentDate_arr[1]),
        day: parseInt(currentDate_arr[2])
    }
    return currentDate_obj
}

const getLunch = async (count, schoolInfo) => {
  let url;
  switch(schoolInfo.schoolName) {
    case "pohang-daeheung-middle":
      url = "https://school.iamservice.net/api/article/organization/16777/group/2068031?next_token="
      break;
    case "pohang-joongang-high":
      url = "https://school.iamservice.net/api/article/organization/16086/group/2062519?next_token="
      break;
    default:
      console.log("Can not find schoolName")
      throw new Error("Can not find schoolName");
  }
  try {
    const currentLunches =  await axios.get(url+String(count));
    if(!currentLunches.data.articles.length) return null
    return currentLunches
  } catch (error) {
    console.error(error);
    return null
  }
};
const getTodayLunch = async (count, currentDate_obj = 0, schoolInfo, todayLimit=0, finalLunch=[]) => {
  console.log(count)
  let lunches = await getLunch(count, schoolInfo);
  if(lunches === null){
    console.log("?????");
    return "급식을 불러오지 못했습니다."
  }
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
        menu:menu,
        kind: lunch.author

      }
      return lunch_with_date
  })
  let last_date;
  // todayLimit 오늘 급식은 중식, 석식 두 가지 둘 다 불러오려면 해당 변수 필요함
  //3개의 급식을 불러오기 위해 request를 1번 더 보내야 하는 경우도 생길 수 있으므로 추후 리팩토링 요구
  for(var i in lunches_with_date){
      let lunch = lunches_with_date[i];
      if(todayLimit === 0){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch)
          todayLimit++;       
        }
      } else if(todayLimit === 1){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch);
        }
        todayLimit++
      } else if(todayLimit === 2){
        if(lunch.date.year === currentDate_obj.year && lunch.date.month === currentDate_obj.month && lunch.date.day === currentDate_obj.day){
          finalLunch.push(lunch);
          console.log(finalLunch);
        }
        todayLimit++
      }else if(todayLimit === 3){
        let finalString = "";
        finalLunch = finalLunch.reverse();
        for(let i in finalLunch){
          finalString += finalLunch[i].menu+"\n"+String(finalLunch[i].date.year)+"년 " + String(finalLunch[i].date.month) + "월 " + String(finalLunch[i].date.day) +"일"+ `${finalLunch[i].kind} 입니다.\n\n`
        }
        return finalString;
      } 
  }
  last_date = lunches_with_date[i].date
  console.log("last date")
  if(last_date.year < currentDate_obj.year){
    console.log("nothing same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
  } else if(last_date.year === currentDate_obj.year && last_date.month < currentDate_obj.month){
    console.log("year same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
  } else if(last_date.year === currentDate_obj.year && last_date.month === currentDate_obj.month && last_date.day < currentDate_obj.day){
    console.log("month same")
    return "해당 날짜의 급식을 불러오지 못했습니다."
}

  let final =  await getTodayLunch(count+20, currentDate_obj, schoolInfo, todayLimit, finalLunch);
  return final;
}
const sendLunch = async(currentDate_obj = 0, res, schoolInfo,  msg = "") => {
  let result = await getTodayLunch(0, currentDate_obj, schoolInfo);
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

apiRouter.post('/notice', function(req, res){
  sendNoticeAndLetter("notice", 3, res)
})
apiRouter.post('/letter', function(req, res){
  sendNoticeAndLetter("letter", 3, res)
})

apiRouter.post('/eunha', function(req, res) {
  
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
  const schoolName = req.header("schoolName");
  const schoolKind = req.header("schoolKind");
  console.log(schoolName)
  const schoolInfo = {
    schoolName,
    schoolKind
  }
  if(req.body.action){
    let action_info = req.body.action.params//.forEach((value, key, mapObject) => console.log(key +' , ' +value));
    
    action_info = JSON.parse(action_info.sys_date)
    //let allergy_info = req.body.action.알러지정보
    //console.log(allergy_info)
    switch(action_info.dateTag){
      case "today": console.log("today"); sendLunch(getDate(0), res, schoolInfo); break;
      case "tomorrow": sendLunch(getDate(1), res, schoolInfo); break;
      case "yesterday": sendLunch(getDate(-1), res, schoolInfo); break;
      case null: if(action_info.month && action_info.day){
        if(action_info.year === null){
          let date = {
            year: getDate(0).year,
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res, schoolInfo);
          break;
        } else {
          let date = {
            year: parseInt(action_info.year),
            month: parseInt(action_info.month),
            day: parseInt(action_info.day),
          }
          sendLunch(date, res, schoolInfo);
          break;
        }
      }
      break;
      default: sendLunch(getDate(0),res, schoolInfo,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.") 
    }
  } else{
    sendLunch(getDate(0),res, schoolInfo,  "날짜 정보를 불러 오지 못해 오늘 급식을 불러 옵니다.")
  }
  console.log('todayLunch is working')
});


/*app.listen(1337, function() {
  console.log('Example skill server listening on port 3000!');
});*/
const port = 8001
app.listen(process.env.PORT || port)

>>>>>>> edcbbd8dfbc29ef4b9dc92f346d4caf71ae924b0
