"use strict";
var express = require('express');
const nodemailer = require("nodemailer");
//var router = express.Router();
const Router = require('express-promise-router');
const router = new Router()
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const jwt = require('jsonwebtoken');
const joi = require('@hapi/joi');
const { response } = require('express');
// const {check, validationResult }=require('express-validator');
router.post('/savePldForm',(request, response) => {

  console.log('request.body  : '+JSON.stringify(request.body));
  let contactId = request.body.contactId;
  let projectId = request.body.projectId;
  let pldFormUrl = request.body.pldFormUrl;
  let sentDate = request.body.sentDate;
  let projectName = request.body.projectName;
  let pldFormId = request.body.pldFormId;


  pool.query('insert into pld_forms (contactId,projectId,pldFormUrl,sentDate, projectName,pldFormId) values($1,$2,$3,$4,$5,$6)',[contactId,projectId,pldFormUrl, sentDate,projectName, pldFormId])
  .then((pldQueryResult) => {
        console.log('pldQueryResult  '+JSON.stringify(pldQueryResult));
        response.send(pldQueryResult);
  })
  .catch((pldQueryError) => {
      console.log('pldQueryError  '+JSON.stringify(pldQueryError));
      response.send(pldQueryError);
  })

});


router.get('/getpldForm',verify, (request, response) => {

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 

  console.log('request.query  : '+JSON.stringify(request.query));
  let contactId = request.query.contactId;

  pool.query('SELECT pld.project__c, pld.pldform_generatedURL__c, pld.createddate, pld.project_library__c ,pld.name as pldname, pro.name as proname FROM salesforce.sent_pld_form__c as pld INNER JOIN salesforce.Milestone1_Project__c as pro ON pld.project__c = pro.sfid WHERE tocontact__c = $1 AND isactive__c = $2',[userId, true])
  .then((pldQueryResult) => {
        console.log('pldQueryResult  : '+JSON.stringify(pldQueryResult.rows));
        if(pldQueryResult.rowCount > 0)
        {
          response.send(pldQueryResult.rows); 
        }
        else{
          response.send([]);
        }
  })
  .catch((pldQueryError) => {
      console.log('pldQueryError :  '+pldQueryError);
      response.send([]);
  })

});


router.get('/viewResponses',verify,(request,response)=>{

  let pldFormId = request.query.pldformid;
  console.log('pldFormId : '+pldFormId );

  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 

  pool
  .query('SELECT psr.sfid, psr.name, psr.createdDate, ca.status__c from salesforce.Project_Survey_Response__c as psr LEFT JOIN salesforce.Custom_Approval__c as ca ON  psr.sfid = ca.expense__c WHERE Project_Library__c = $1 AND Response_By__c = $2',[pldFormId, userId])
  .then((pldResponseQueryResult) => {
    console.log('pldResponseQueryResult  '+JSON.stringify(pldResponseQueryResult.rows));
    if(pldResponseQueryResult.rowCount > 0)
    {
      response.send(pldResponseQueryResult.rows);
    }
    else
    {
      response.send([]);
    }

  })
  .catch((pldResponseQueryError) => {
    console.log('pldResponseQueryError : '+pldResponseQueryError.error);
    response.send([]);
  });

});

/* GET users listing. */
router.get('/login', function(req, response, next) {
    response.render('login');
});


router.post('/login', async (request,response)=>{

  const {email, password} = request.body;
  console.log('email : '+email+' passoword '+password);

  let errors = [], userId, objUser, isUserExist = false;

  if (!email || !password) {
    errors.push({ msg: 'Please enter all fields' });
    response.render('login',{errors});
  }

  await
  pool
  .query('SELECT Id, sfid, Name, email,PM_email__c FROM salesforce.Contact WHERE email = $1 AND password2__c = $2',[email,password])
  .then((loginResult) => {
        console.log('loginResult.rows[0]  '+JSON.stringify(loginResult.rows[0]));
        if(loginResult.rowCount > 0)
        {
          userId = loginResult.rows[0].sfid;
          objUser = loginResult.rows[0];
          isUserExist = true;
        }
        else
        {
          isUserExist = false;
        }      
  }) 
  .catch((loginError) =>{
    console.log('loginError   :  '+loginError.stack);
    isUserExist = false;
  })

  await 
  pool.query('SELECT sfid FROM salesforce.Team__c WHERE Manager__c =  $1 ',[userId])
  .then((teamQueryResult) => {
        if(teamQueryResult.rowCount > 0)
              objUser.isManager = true;
        else
              objUser.isManager = false; 
  })
  .catch((teamQueryError) => {

  })

  if(isUserExist && errors.length == 0)
  {
    const token = jwt.sign({ user : objUser }, process.env.TOKEN_SECRET, {
      expiresIn: 8640000 // expires in 24 hours
    });
  
    response.cookie('jwt',token, { httpOnly: false, secure: false, maxAge: 3600000 });
    response.header('auth-token', token).render('dashboard',{objUser});
  }
  else
  {
    response.render('login',{errors});
  }
    
}) 

router.get('/home',verify, (request, response) => {
    let objUser = request.user;
    response.render('dashboard',{objUser});
})


router.get('/getuser',verify, (request, response) => {

    console.log('request.user '+JSON.stringify(request.user));
    console.log('request.user.id   :  '+request.user.sfid);
    console.log('request.user.name :  '+request.user.name);
    response.send('Hello Amit');

});

router.get('/timesheet',verify,function(request,response){ 

  console.log('request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid;
  let objUser = request.user;
  console.log('userId : '+userId);
//  response.render('timesheetcalendar');

   var projectName ='';
    pool
    //.query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
   .query('SELECT sfid, Name FROM salesforce.Contact')
    .then(contactResult => {
      console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
      var contactId = contactResult.rows[0].sfid;
        pool
        .query('SELECT sfid, name, Team__c FROM salesforce.Team_Member__c')
        .then(teamMemberResult => {
          console.log('team '+JSON.stringify(teamMemberResult.rows));
          if(teamMemberResult.rowCount>0){
            console.log('Name of TeamMemberId   : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
            console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
            console.log('Number of Team Member '+teamMemberResult.rows.length);
          }
        
          
          var projectTeamparams = [], lstTeamId = [];
          for(var i = 1; i <= teamMemberResult.rows.length; i++) {
            projectTeamparams.push('$' + i);
            lstTeamId.push(teamMemberResult.rows[i-1].team__c);
          } 
          var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
          console.log('projectTeamQueryText '+projectTeamQueryText);
          
            pool
            .query(projectTeamQueryText,lstTeamId)
            .then((projectTeamResult) => {
                console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
                console.log('projectTeam Name '+projectTeamResult.rows[0].name);
  
                var projectParams = [], lstProjectId = [];
                for(var i = 1; i <= projectTeamResult.rows.length; i++) {
                  projectParams.push('$' + i);
                  lstProjectId.push(projectTeamResult.rows[i-1].project__c);
                } 
                console.log('lstProjectId  : '+lstProjectId);
               // var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';
               var projetQueryText='SELECT sfid,Project_Manager__c, Name FROM salesforce.Milestone1_Project__c';
               console.log('project query from user '+projetQueryText);
                pool.
                query(projetQueryText)
                .then((projectQueryResult) => { 
                      console.log('Number of Projects '+projectQueryResult.rows.length);
                      console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name +' MAnager '+projectQueryResult.rows[0].project_manager__c);
                      var projectList = projectQueryResult.rows;
                      var lstProjectId = [], projectParams = [];
                      var j = 1;
                      projectList.forEach((eachProject) => {
                        console.log('eachProject sfid : '+eachProject.sfid);
                        lstProjectId.push(eachProject.sfid);
                        projectParams.push('$'+ j);
                        console.log('eachProject name : '+eachProject.name);
                        j++;
                      });
  
                    //  var milestoneQueryText = 'SELECT Id,Name FROM salesforce.Milestone1_Milestone__c WHERE Project__c IN ('+projectParams.join(',')+') AND Name = ;
                    //  pool.query
  
                  /*  var taskQueryText = 'SELECT task.sfid, task.Name, task.Project_Milestone__c, mile.sfid FROM salesforce.Milestone1_Task__c task, Salesforce.Milestone1_Milestone__c mile '
                    + 'WHERE '
                    + 'task.Project_Name__c IN ('+projectParams.join(',')+ ') ' 
                    + 'AND task.Project_Milestone__c = mile.sfid '
                    + 'AND mile.Name = \'Timesheet Category\'';  */
  
                    var taskQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Task__c  WHERE Project_Name__c IN ('+projectParams.join(',')+') AND  Project_Milestone__c IN (SELECT sfid FROM salesforce.Milestone1_Milestone__c WHERE Name = \'Timesheet Category\') AND sfid IS NOT NULL';
                    console.log('taskQueryText  : '+taskQueryText);
  
  
  
                      pool
                      .query(taskQueryText, lstProjectId)
                      .then((taskQueryResult) => {
                          console.log('taskQueryResult  rows '+taskQueryResult.rows.length);
                          response.render('./timesheets/timesheetcalendar',{objUser, projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                      })
                      .catch((taskQueryError) => {
                          console.log('taskQueryError : '+taskQueryError.stack);
                          response.send(403);
                      })
                      
                })
                .catch((projectQueryError) => {
                      console.log('projectQueryError '+projectQueryError.stack);
                      //response.send(403);
                      response.render('./timesheets/timesheetcalendar',{objUser, projectList : [], contactList : [], taskList : [] }); // render calendar
                })
             
            })
              .catch((projectTeamQueryError) =>{
                console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
               // response.send(403);
               response.render('./timesheets/timesheetcalendar',{objUser, projectList : [], contactList : [], taskList : [] }); 
              })          
           })

          .catch((teamMemberQueryError) => {
            console.log('Error in team member query '+teamMemberQueryError.stack);
            //response.send(403);
            response.render('./timesheets/timesheetcalendar',{objUser, projectList : [], contactList : [], taskList : [] }); 
          })
  
        }) 
        .catch((contactQueryError) => {
            console.error('Error executing contact query', contactQueryError.stack);
            response.send(403);
        });
 
});


router.get('/geteventsTeam',verify,async function(req,res,next){
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));

  var projTeampram=[],lstProjTeam=[];
  var taskparam=[],lsttask=[];
  var lstTeams=[];
  var teamParam = [];
  let teamMember=[];
  let teamMemberParam=[];
  teamMemberParam.push('$' + 1);
  teamMember.push(userId);

  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();
  let projectTeamMap = new Map();
  let teamProjId=[];


  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }  
  
  let projectTeamQuery='SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c IS NOT NULL';
    console.log('All project Team '+projectTeamQuery);
    pool.query(projectTeamQuery)
    .then((projTeamResult)=>{
      if(projTeamResult.rowCount>0){
        projTeampram.push('$' + 1);
        lstProjTeam.push(userId);
         for(var i = 2; i <= projTeamResult.rows.length+1; i++) {
          projTeampram.push('$' + i);
          lstProjTeam.push(projTeamResult.rows[i-2].team__c);
          projectTeamMap.set(projTeamResult.rows[i-2].team__c,projTeamResult.rows[i-2].project__c);
         }
         let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
         console.log('teamQry '+teamQry);
        pool.query(teamQry,lstProjTeam)
        .then((teamQueryResult) => {
        if(teamQueryResult.rowCount>0)
        {
        console.log('teamQueryResult team '+JSON.stringify(teamQueryResult.rows));
          
          for(var i = 1; i <= teamQueryResult.rows.length; i++) {
            teamParam.push('$' + i);
            lstTeams.push(teamQueryResult.rows[i-1].sfid);
            var teamid=teamQueryResult.rows[i-1].sfid;
            //console.log(teamid+'  88888888888888*********************'+projectTeamMap.has(teamid));
            if(projectTeamMap.has(teamid)){
            //  console.log('taemfek '+teamQueryResult.rows[i-1].sfid);
              teamProjId.push(projectTeamMap.get(teamQueryResult.rows[i-1].sfid));
              console.log('event project '+projectTeamMap.get(teamQueryResult.rows[i-1].sfid));
            }
          } 
  
        console.log(' lstTeams '+lstTeams+' teamParam '+teamParam +'teamProjId '+teamProjId);
        let teamUserQuery='SELECT Id, sfid,Representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN ('+ teamParam.join(',')+ ')';
        console.log('teamUserQuery '+teamUserQuery);
        pool.query(teamUserQuery,lstTeams)
        .then((userTeamQueryResult)=>{
          console.log('userTeamQueryResult '+JSON.stringify(userTeamQueryResult.rows));
          for(var i = 2; i <= userTeamQueryResult.rows.length+1; i++) {
            teamMemberParam.push('$' + i);
            teamMember.push(userTeamQueryResult.rows[i-2].representative__c);
          } 
          console.log('Team Member involne in Team '+teamMember +'dollers '+teamMemberParam);
          let qry ='SELECT Id, sfid , Planned_Hours__c,Project_Name__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE sfid IS NOT NULL AND Assigned_Manager__c IN ('+ teamMemberParam.join(',')+ ')';
           console.log('qry xxxxxxxxxxx' +qry);
           pool.query(qry,teamMember)
           .then((taskQueryResult) => {
             console.log('taskQueryResult '+taskQueryResult.rowCount);
             console.log('teamProjId '+teamProjId.length);
           /*  for(var i = 1; i <= taskQueryResult.rowCount; i++) {
              taskparam.push('$' + i);
              lsttask.push(taskQueryResult.rows[i-1].sfid);
              } */
                 if(taskQueryResult.rowCount > 0)
                 {
                   taskQueryResult.rows.forEach((eachTask) =>{
                     // console.log('foreachTAsk '+JSON.stringify(eachTask));
                     // teamProjId.forEach((eachProject)=>{
                        for(var i = 1; i <= teamProjId.length; i++){
                        console.log('each prject inside if '+teamProjId[i-1])
                        
                      //console.log('eachProject '+eachProject);
                      if(eachTask.project_name__c==teamProjId[i-1]){
                        console.log('eachProject '+teamProjId[i-1]);
                        lsttask.push(eachTask.sfid);
                       
                        var date = convert(eachTask.start_date__c);
                        console.log('date xxx  '+date+'  eachTask.planned_hours__c  xxxxx : '+eachTask.planned_hours__c);
                       
                        console.log('plannedHoursMap.has(date)  xxx'+plannedHoursMap.has(date));
                        console.log('Opposite plannedHoursMap.has(date)  xxx'+(!plannedHoursMap.has(date)));
                        if( !plannedHoursMap.has(date))
                        {
                          plannedHoursMap.set(date, eachTask.planned_hours__c);
                          console.log('if Block '+eachTask.planned_hours__c);
                          if(eachTask.planned_hours__c != null)
                            plannedHoursMap.set(date, eachTask.planned_hours__c);
                          else
                            plannedHoursMap.set(date, 0);
                        }
                        else
                        {
                            
                            let previousHours = plannedHoursMap.get(date);
                            console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                            let currentHours = eachTask.planned_hours__c;
                            console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                            if(currentHours != null)
                            {
                              console.log('date  xx'+date +'previousHours + currentHours  '+(previousHours + currentHours));
                              plannedHoursMap.set(date, previousHours + currentHours );
                            }
                        }
                      }
                    }

                   })
                   for(var i = 1; i <= lsttask.length; i++) {
                    taskparam.push('$' + i);
                   }
                   let timeQuery ='SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN ('+ taskparam.join(',')+ ')'+' AND sfid != \''+''+'\''; 
                   console.log('tiemquery '+timeQuery);
                   console.log('lsttask '+lsttask);
                   pool.query(timeQuery,lsttask)
                     .then((timesheetQueryResult) => {
                         console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult.rows));
                         console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
                         if(timesheetQueryResult.rowCount > 0)
                         {
                           
                            
                           timesheetQueryResult.rows.forEach((eachTimesheet) => {
                             
                               let fillingDate = convert(eachTimesheet.date__c);
                               console.log('fillingDate TeamView '+fillingDate);
                   
                               if( ! actualHoursMap.has(fillingDate))
                               {
                                   if(eachTimesheet.calculated_hours__c != null)
                                     actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                                   else
                                     actualHoursMap.set(fillingDate, 0);
                               }
                               else
                               {
                                  let previousFilledHours =  actualHoursMap.get(fillingDate);
                                  let currentFilledHours = eachTimesheet.calculated_hours__c;
                                  if(currentFilledHours != null)
                                  {
                                     actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                                  }
                                  else
                                     actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                               }
                   
                               for(let time of actualHoursMap)
                               {
                                 console.log('time  : '+time);
                               }
                             
                           })
                           var lstEvents = [];
        for(let i = 1;i <= numberOfDays ; i++)
        {
            let day = i , twoDigitMonth = month+1;
            if(day >= 1 && day <= 9)
            {
                day = '0'+i;
            }
            if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
            {
              twoDigitMonth = '0'+twoDigitMonth;
            }
      
            var date = year+'-'+twoDigitMonth+'-'+day;
           // console.log('date inside events '+date);
          //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
            if(plannedHoursMap.has(date))
            {
                console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
                lstEvents.push({
                  title : 'Planned Hours : '+plannedHoursMap.get(date),
                  start : year+'-'+twoDigitMonth+'-'+day,   
                });
               
            }
            else
            {
                lstEvents.push({
                  title : 'Planned Hours : '+'0',
                  start : year+'-'+twoDigitMonth+'-'+day,   
                });
            }
      
      
            if(actualHoursMap.has(date))
            {
                lstEvents.push({
                  title : 'Actual Hours : '+actualHoursMap.get(date),
                  start : year+'-'+twoDigitMonth+'-'+day,   
                });
            }
            else
            {
                lstEvents.push({
                  title : 'Actual Hours : '+'0',
                  start : year+'-'+twoDigitMonth+'-'+day,   
                });
            }
      
            lstEvents.push({
              title : 'Create Task',
              start : year+'-'+twoDigitMonth+'-'+day,   
            });
            lstEvents.push({
              title : 'Details',
              start : year+'-'+twoDigitMonth+'-'+day,   
            });
            
            lstEvents.push({
              title : 'Fill Actuals',
              start : year+'-'+twoDigitMonth+'-'+day,   
            });
         
        } 
          console.log('JSON.strigify teamView'+JSON.stringify(lstEvents));
          res.send(lstEvents);
                         }
                         
                   
                     })
                     .catch((timesheetQueryError) => {
                       console.log('timesheetQueryError  '+timesheetQueryError.stack);
                     })
                  /********************************************
                       taskQueryResult.rows.forEach((eachTask) =>{
                           var date = convert(eachTask.start_date__c);
                           console.log('date xxx  '+date+'  eachTask.planned_hours__c  xxxxx : '+eachTask.planned_hours__c);
                          
                           console.log('plannedHoursMap.has(date)  xxx'+plannedHoursMap.has(date));
                           console.log('Opposite plannedHoursMap.has(date)  xxx'+(!plannedHoursMap.has(date)));
                           if( !plannedHoursMap.has(date))
                           {
                             plannedHoursMap.set(date, eachTask.planned_hours__c);
                             console.log('if Block '+eachTask.planned_hours__c);
                             if(eachTask.planned_hours__c != null)
                               plannedHoursMap.set(date, eachTask.planned_hours__c);
                             else
                               plannedHoursMap.set(date, 0);
                           }
                           else
                           {
                               
                               let previousHours = plannedHoursMap.get(date);
                               console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                               let currentHours = eachTask.planned_hours__c;
                               console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                               if(currentHours != null)
                               {
                                 console.log('date  xx'+date +'previousHours + currentHours  '+(previousHours + currentHours));
                                 plannedHoursMap.set(date, previousHours + currentHours );
                               }
                           }
                       })
         
                       let mapIter = plannedHoursMap.entries();
                       console.log('plannedHoursMap    size '+plannedHoursMap.size);
                       
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
         
                       for (let key of plannedHoursMap.keys()) {
                        console.log('key :'+key)
                       }
         
                       for(let value of plannedHoursMap.values()){
                         console.log('values : '+value);
                       }
                       *****************************************/
                 }
               //  let timesheetqry='SELECT sfid, date__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE representative__c IN ('+ teamMemberParam.join(',')+ ')'+' AND sfid != \''+''+'\'';
              
           })
  
  
           .catch((taskQueryError) => {
                 console.log('taskQueryError  xxxx :  '+taskQueryError.stack);
           })
  
  
        })
        .catch((error)=>{
          console.log('eroor in Team USer ID '+error.stack);
        })
      }
      })
      .catch((teamQueryError)=>{
        console.log('teamQueryResult '+teamQueryError.stack);
      })
    }
    })
    .catch((error)=>{
      console.log('eroro in PRojectTEam '+JSON.stringify(error.stack));

    })

  console.log('Just above Team View')
  
 });


 

 router.get('/geteventsProjteam',verify,async function(req,res,next) {
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  var projId=req.query.projectid;
  console.log('projId '+projId);

  var projTeampram=[],lstProjTeam=[];
  var lstTeams=[];
  var teamParam = [];
  let teamMember=[];
  teamMember.push(projId);
  let teamMemberParam=[];
  teamMemberParam.push('$' + 2);
  teamMember.push(userId);
  var taskparam=[];
  var lsttask=[];
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

  /* projectTeamQuery='SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c=$1';
  await pool.query(projectTeamQuery,[projId])
  .then((projTeamResult)=>{
    param.push('$' + 1);
    lstpramaId.push(userId);
     for(var i = 2; i <= projTeamResult.rows.length; i++) {
      projTeampram.push('$' + i);
      lstProjTeam.push(projTeamResult.rows[i-2].team__c);
     }

  }).catch((projectTeamQuery)=>{
    console.log('anjksdnjds'+JSON.stringify(projectTeamQuery.stack));
  })
  let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
      console.log('teamQry '+teamQry);
 */
  var projectTeamQuery='SELECT id,name,sfid,Project__c,Team__c FROM salesforce.Project_Team__c WHERE Project__c=$1';
   console.log('projectTeamQuery '+projectTeamQuery);
   await pool.query(projectTeamQuery,[projId])
  .then((projTeamResult)=>{
    if(projTeamResult.rowCount>0){
     // projTeampram.push('$' + 1);
      lstProjTeam.push(userId);
       for(var i = 2; i <= projTeamResult.rows.length+1; i++) {
        projTeampram.push('$' + i);
        lstProjTeam.push(projTeamResult.rows[i-2].team__c);
       }
       let teamQry = 'SELECT Id, sfid , Manager__c, name FROM salesforce.Team__c WHERE Manager__c = $1 AND sfid IN ('+ projTeampram.join(',')+ ')';
       console.log('teamQry '+teamQry);
       pool.query(teamQry,lstProjTeam)
       .then((teamQueryResult) => {
        if(teamQueryResult.rowCount>0)
        {
        console.log('teamQueryResult team '+JSON.stringify(teamQueryResult.rows));
        console.log('team size '+teamQueryResult.rowCount);
          for(var i = 1; i <= teamQueryResult.rows.length; i++) {
            teamParam.push('$' + i);
            lstTeams.push(teamQueryResult.rows[i-1].sfid);
          } 
  
        console.log(' lstTeams '+lstTeams+' teamParam '+teamParam);
        let teamUserQuery='SELECT Id, sfid,Representative__c , team__c FROM salesforce.Team_Member__c WHERE team__c IN ('+ teamParam.join(',')+ ')';
        console.log('teamUserQuery '+teamUserQuery);
        pool.query(teamUserQuery,lstTeams)
        .then((userTeamQueryResult)=>{
          console.log('userTeamQueryResult '+JSON.stringify(userTeamQueryResult.rows));
          console.log('member size '+userTeamQueryResult.rowCount);
          for(var i = 3; i <= userTeamQueryResult.rows.length+2; i++) {
            teamMemberParam.push('$' + i);
            teamMember.push(userTeamQueryResult.rows[i-3].representative__c);
          } 
          console.log('Team Member involne in Team '+teamMember +'dollers '+teamMemberParam);
          let qry ='SELECT Id, sfid , Planned_Hours__c,project_name__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE project_name__c=$1 AND Assigned_Manager__c IN ('+ teamMemberParam.join(',')+ ')';
           console.log('qry xxxxxxxxxxx' +qry);
           pool.query(qry,teamMember)
           .then((taskQueryResult) => {
            for(var i = 1; i <= taskQueryResult.rowCount; i++) {
              taskparam.push('$' + i);
              lsttask.push(taskQueryResult.rows[i-1].sfid);
        }
             console.log('taskQueryResult '+JSON.stringify(taskQueryResult.rows));
                 if(taskQueryResult.rowCount > 0)
                 {
                       taskQueryResult.rows.forEach((eachTask) =>{
                           var date = convert(eachTask.start_date__c);
                           console.log('date xxx  '+date+'  eachTask.planned_hours__c  xxxxx : '+eachTask.planned_hours__c);
                          
                           console.log('plannedHoursMap.has(date)  xxx'+plannedHoursMap.has(date));
                           console.log('Opposite plannedHoursMap.has(date)  xxx'+(!plannedHoursMap.has(date)));
                           if( !plannedHoursMap.has(date))
                           {
                             plannedHoursMap.set(date, eachTask.planned_hours__c);
                             console.log('if Block '+eachTask.planned_hours__c);
                             if(eachTask.planned_hours__c != null)
                               plannedHoursMap.set(date, eachTask.planned_hours__c);
                             else
                               plannedHoursMap.set(date, 0);
                           }
                           else
                           {
                               
                               let previousHours = plannedHoursMap.get(date);
                               console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                               let currentHours = eachTask.planned_hours__c;
                               console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                               if(currentHours != null)
                               {
                                 console.log('date  xx'+date +'previousHours + currentHours  '+(previousHours + currentHours));
                                 plannedHoursMap.set(date, previousHours + currentHours );
                               }
                           }
                       })
         
                       let mapIter = plannedHoursMap.entries();
                       console.log('plannedHoursMap    size '+plannedHoursMap.size);
                       
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
                       console.log(mapIter.next().value);
         
                       for (let key of plannedHoursMap.keys()) {
                        console.log('key :'+key)
                       }
         
                       for(let value of plannedHoursMap.values()){
                         console.log('values : '+value);
                       }
                 }
                         //let qryTimesheet ='SELECT sfid,name, date__c,projecttimesheet__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE projecttimesheet__c=$1 AND representative__c IN ('+ teamMemberParam.join(',')+ ')'+' AND  sfid != \''+''+'\'';
                        let timeQuery ='SELECT sfid, date__c, calculated_hours__c, project_task__c  FROM salesforce.Milestone1_Time__c WHERE project_task__c IN ('+ taskparam.join(',')+ ')'+' AND sfid != \''+''+'\'';
                      
                         console.log('qryyyyyyyyyyyyyyyyyy '+timeQuery);
                         pool.query(timeQuery,lsttask)
                          .then((timesheetQueryResult) => {
                          console.log('timesheetQueryResult teamPRoj '+JSON.stringify(timesheetQueryResult.rows));
                          console.log('timesheetQueryResult.rowCount teamPRoj'+timesheetQueryResult.rowCount);
                          if(timesheetQueryResult.rowCount > 0)
                            {
                            timesheetQueryResult.rows.forEach((eachTimesheet) => {           
                              let fillingDate = convert(eachTimesheet.date__c);
                              console.log('fillingDate TeamView '+fillingDate); 
                              if( ! actualHoursMap.has(fillingDate))
                                    {
                                      if(eachTimesheet.calculated_hours__c != null){
                                        actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                                      }
                                        else{
                                          actualHoursMap.set(fillingDate, 0);
                                        }
                                    }
                                        else
                                        {
                                          let previousFilledHours =  actualHoursMap.get(fillingDate);
                                          let currentFilledHours = eachTimesheet.calculated_hours__c;
                                          if(currentFilledHours != null)
                                          {
                                            actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
                                            }
                                            else
                                            {
                                              actualHoursMap.set(fillingDate, (previousFilledHours + 0));
                                            }
                                            }
                                            for(let time of actualHoursMap)
                                            {
                                              console.log('time  : '+time);
                                              }
                        })
                        var lstEvents = [];
                        for(let i = 1;i <= numberOfDays ; i++)
                        {
                            let day = i , twoDigitMonth = month+1;
                            if(day >= 1 && day <= 9)
                            {
                                day = '0'+i;
                            }
                            if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
                            {
                              twoDigitMonth = '0'+twoDigitMonth;
                            }
                      
                            var date = year+'-'+twoDigitMonth+'-'+day;
                            console.log('date inside events '+date);
                            console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
                            if(plannedHoursMap.has(date))
                            {
                                console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
                                lstEvents.push({
                                  title : 'Planned Hours : '+plannedHoursMap.get(date),
                                  start : year+'-'+twoDigitMonth+'-'+day,   
                                });
                               
                            }
                            else
                            {
                                lstEvents.push({
                                  title : 'Planned Hours : '+'0',
                                  start : year+'-'+twoDigitMonth+'-'+day,   
                                });
                            }
                      
                      
                            if(actualHoursMap.has(date))
                            {
                                lstEvents.push({
                                  title : 'Actual Hours : '+actualHoursMap.get(date),
                                  start : year+'-'+twoDigitMonth+'-'+day,   
                                });
                            }
                            else
                            {
                                lstEvents.push({
                                  title : 'Actual Hours : '+'0',
                                  start : year+'-'+twoDigitMonth+'-'+day,   
                                });
                            }
                      
                            lstEvents.push({
                              title : 'Create Task',
                              start : year+'-'+twoDigitMonth+'-'+day,   
                            });
                            lstEvents.push({
                              title : 'Details',
                              start : year+'-'+twoDigitMonth+'-'+day,   
                            });
                            
                            lstEvents.push({
                              title : 'Fill Actuals',
                              start : year+'-'+twoDigitMonth+'-'+day,   
                            });
                         
                        } 
                         // console.log('JSON.strigify '+JSON.stringify(lstEvents));
                          res.send(lstEvents);
                      
                                              
      }
        
  
    })
    .catch((timesheetQueryError) => {
      console.log('timesheetQueryError  '+timesheetQueryError.stack);
    })
           })
  
  
           .catch((taskQueryError) => {
                 console.log('taskQueryError  xxxx :  '+taskQueryError.stack);
           })
  
  
        })
        .catch((error)=>{
          console.log('eroor in Team USer ID '+error.stack);
        })
      }
      })
      .catch((teamQueryError)=>{
        console.log('teamQueryResult '+teamQueryError.stack);
      })
    }

  })
  .catch((projtemerror)=>{
    console.log('projtemerror '+projtemerror.stack);
  }) 
 })
 
router.get('/getNullevents',verify,async function(req,res,next) {
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
   
      
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
    


     
    
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
    console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);
  
})



router.get('/geteventsProj',verify,async function(req,res,next){
  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId+' ObjUser :'+JSON.stringify(req.user));
  var projId=req.query.projectid;
  console.log('projId '+projId);

  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  var timesheetParams=[];
  var lsttskid =[];
  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }  
  
  await pool.query('SELECT Id,name, sfid ,project_name__c, planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c = $1 AND project_name__c =$2' ,[userId,projId])
  .then((taskQueryResult) => {
    console.log('sizzzz '+taskQueryResult.rowCount);
    for(let i=1; i<= taskQueryResult.rowCount ; i++)
    {
        lsttskid.push(taskQueryResult.rows[i-1].sfid)
        timesheetParams.push('$'+i);
    }  

        if(taskQueryResult.rowCount > 0)
        {
          console.log('taskQueryResult proj '+JSON.stringify(taskQueryResult.rows));
              taskQueryResult.rows.forEach((eachTask) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);
                 
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
 console.log(timesheetQuery)
  // await pool.query('SELECT name,sfid, date__c, projecttimesheet__c,representative__c,calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE projecttimesheet__c=$1 AND representative__c=$2 AND sfid IS NOT null',[projId,userId])
 await pool.query(timesheetQuery,lsttskid) 
 .then((timesheetQueryResult) => {
   console.log('timesheetQueryResult project '+JSON.stringify(timesheetQueryResult.rows));
   console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
   if(timesheetQueryResult.rowCount > 0)
   {
     timesheetQueryResult.rows.forEach((eachTimesheet) => {
       
         let fillingDate = convert(eachTimesheet.date__c);
         console.log('fillingDate  '+fillingDate);

         if( ! actualHoursMap.has(fillingDate))
         {
             if(eachTimesheet.calculated_hours__c != null)
               actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
             else
               actualHoursMap.set(fillingDate, 0);
         }
         else
         {
            let previousFilledHours =  actualHoursMap.get(fillingDate);
            let currentFilledHours = eachTimesheet.calculated_hours__c;
            if(currentFilledHours != null)
            {
               actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
            }
            else
               actualHoursMap.set(fillingDate, (previousFilledHours + 0));
         }

         for(let time of actualHoursMap)
         {
           console.log('time  : '+time);
         }
       
     })
   }
   

}).catch((timesheetQueryError) => {
  console.log('timesheetQueryError  '+timesheetQueryError.stack);
})


  console.log('Just above proj $$ current  ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+plannedHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
   // console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);



})

router.get('/getevents',verify, async function(req, res, next) {

  console.log('request.user '+JSON.stringify(req.user));
  var userId = req.user.sfid;
  console.log('userId : '+userId);

  
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);
  console.log('selectedDate   : '+selectedDate);
  console.log('typeof(selectedDate)   : '+typeof(selectedDate));
  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  let plannedHoursMap = new Map();
  let actualHoursMap = new Map();

  var timesheetParams=[];
  var lsttskid =[];
  function convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }  

  await pool.query('SELECT Id, sfid , Planned_Hours__c, Start_Date__c FROM salesforce.Milestone1_Task__c WHERE Assigned_Manager__c = $1',[userId])
  .then((taskQueryResult) => {
    console.log('taskQuery allProject curretUser '+JSON.stringify(taskQueryResult.rows));
    for(let i=1; i<= taskQueryResult.rowCount ; i++)
    {
        lsttskid.push(taskQueryResult.rows[i-1].sfid)
        timesheetParams.push('$'+i);
    }  
        if(taskQueryResult.rowCount > 0)
        {
              taskQueryResult.rows.forEach((eachTask) =>{
                  var date = convert(eachTask.start_date__c);
                  console.log('date  '+date+'  eachTask.planned_hours__c  : '+eachTask.planned_hours__c);
                 
                  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date));
                  console.log('Opposite plannedHoursMap.has(date)  '+(!plannedHoursMap.has(date)));
                  if( !plannedHoursMap.has(date))
                  {
                    plannedHoursMap.set(date, eachTask.planned_hours__c);
                    console.log('if Block '+eachTask.planned_hours__c);
                    if(eachTask.planned_hours__c != null)
                      plannedHoursMap.set(date, eachTask.planned_hours__c);
                    else
                      plannedHoursMap.set(date, 0);
                  }
                  else
                  {
                      
                      let previousHours = plannedHoursMap.get(date);
                      console.log('date   '+date +'  else Block Previous Hours : '+previousHours);
                      let currentHours = eachTask.planned_hours__c;
                      console.log('date   '+date +'  else Block Current Hours : '+currentHours);
                      if(currentHours != null)
                      {
                        console.log('date  '+date +'previousHours + currentHours  '+(previousHours + currentHours));
                        plannedHoursMap.set(date, previousHours + currentHours );
                      }
                  }
              })

              let mapIter = plannedHoursMap.entries();
              console.log('plannedHoursMap    size '+plannedHoursMap.size);
              
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);
              console.log(mapIter.next().value);

              for (let key of plannedHoursMap.keys()) {
               console.log('key :'+key)
              }

              for(let value of plannedHoursMap.values()){
                console.log('values : '+value);
              }
        }
  })
  .catch((taskQueryError) => {
        console.log('taskQueryError   :  '+taskQueryError.stack);
  })

  var timesheetQuery = 'SELECT sfid, date__c, calculated_hours__c, project_Task__c  FROM salesforce.Milestone1_Time__c WHERE sfid != \''+''+'\' AND Project_Task__c IN ('+ timesheetParams.join(',') +')';
  console.log(timesheetQuery)
 // await pool.query('SELECT sfid, date__c,representative__c, calculated_hours__c FROM salesforce.Milestone1_Time__c WHERE representative__c=$1 AND sfid != \''+''+'\'',[userId])
 await pool.query(timesheetQuery,lsttskid) 
 .then((timesheetQueryResult) => {
      console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult.rows));
      console.log('timesheetQueryResult.rowCount '+timesheetQueryResult.rowCount);
      if(timesheetQueryResult.rowCount > 0)
      {
        timesheetQueryResult.rows.forEach((eachTimesheet) => {
          
            let fillingDate = convert(eachTimesheet.date__c);
            console.log('fillingDate  '+fillingDate);

            if( ! actualHoursMap.has(fillingDate))
            {
                if(eachTimesheet.calculated_hours__c != null)
                  actualHoursMap.set(fillingDate, eachTimesheet.calculated_hours__c);
                else
                  actualHoursMap.set(fillingDate, 0);
            }
            else
            {
               let previousFilledHours =  actualHoursMap.get(fillingDate);
               let currentFilledHours = eachTimesheet.calculated_hours__c;
               if(currentFilledHours != null)
               {
                  actualHoursMap.set(fillingDate, (previousFilledHours + currentFilledHours));
               }
               else
                  actualHoursMap.set(fillingDate, (previousFilledHours + 0));
            }

            for(let time of actualHoursMap)
            {
              console.log('time  : '+time);
            }
          
        })
      }
      

  })
  .catch((timesheetQueryError) => {
    console.log('timesheetQueryError  '+timesheetQueryError.stack);
  })


  /* Start Actual Hours Query  Calculation */




  /* End Actual Hours Query  Calculation */


  console.log('Just above ')
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
      let day = i , twoDigitMonth = month+1;
      if(day >= 1 && day <= 9)
      {
          day = '0'+i;
      }
      if(twoDigitMonth >= 1 && twoDigitMonth <= 9)
      {
        twoDigitMonth = '0'+twoDigitMonth;
      }

      var date = year+'-'+twoDigitMonth+'-'+day;
     // console.log('date inside events '+date);
    //  console.log('plannedHoursMap.has(date)  '+plannedHoursMap.has(date))
      if(plannedHoursMap.has(date))
      {
          console.log('plannedHoursMap.get(date)  : '+plannedHoursMap.get(date));
          lstEvents.push({
            title : 'Planned Hours : '+plannedHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
         
      }
      else
      {
          lstEvents.push({
            title : 'Planned Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }


      if(actualHoursMap.has(date))
      {
          lstEvents.push({
            title : 'Actual Hours : '+actualHoursMap.get(date),
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }
      else
      {
          lstEvents.push({
            title : 'Actual Hours : '+'0',
            start : year+'-'+twoDigitMonth+'-'+day,   
          });
      }

      lstEvents.push({
        title : 'Create Task',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      lstEvents.push({
        title : 'Details',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
      
      lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+twoDigitMonth+'-'+day,   
      });
   
  } 
   // console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);
 });



router.get('/logout', (request, response) => {
 // request.logout();
 // request.flash('success_msg', 'You are logged out');
  response.redirect('/users/login');
});




/*
Forget Password
*/
router.get('/forgotpassword',(req,res)=>{
  console.log('rendering'+JSON.req);
  res.render('forgetPassword');
})


router.post('/salesforceEmailVeerification',(request,response)=>{
  let emailEnter= request.body;
  const {emailPass }= request.body;
  console.log('emailAddress' +emailPass);
  console.log('Body'+JSON.stringify(emailEnter));
  let queryContact = 'SELECT sfid,email,name FROM salesforce.contact where email=$1' ;
  console.log('querry Contact '+queryContact);
  pool
  .query(queryContact,[emailPass])
  .then((querryResult)=>{
        console.log('queryResult: '+JSON.stringify(querryResult.rows));
        if(querryResult.rowCount==1)
        {
          response.send(querryResult.rows);
        }
        else
        {
          response.send('[]');
        }
  })
  .catch((QueryError)=>{
    console.log('Erros '+ QueryError.stack);
    response.send('QueryError');
  })
})

router.post('/sendEMail',(request,response)=>{
 let bodysent= request.body;
  const {email,sfid ,name} = request.body;
  console.log('emaoBidy' +email);
  console.log('sfid' +sfid);
  console.log('name' +name);
 /*  nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return process.exit(1);
    }  */
    const transporter = nodemailer.createTransport({
     service:'gmail',
      auth: {
          user:'agupta3@kloudrac.com',
          pass:'anukarsh@1998'
      }
  })
  let message = {
    from: 'agupta3@kloudrac.com',
    to:email,
    subject: 'Heroku Password Forget',
    text: 'Plz Click the below link to generate your password',
    html: '<p><a href="http://localhost:7500/users/resetPassword/'+sfid +'">click to resest your password</a></p>' 
  }

  transporter.sendMail(message, (err, info) => {
    if (err) {
        console.log('Error occurred. ' + err.message);
        return process.exit(1);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
  //  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    response.send('Email Sent');
  })
})
router.get('/resetPassword/:userId',(request,response)=>{
  let userId = request.params.userId;
  console.log('userId  : '+userId);
  response.render('resetPassword',{userId});
})
router.post('/updatePass',(request,response)=>{
  console.log('BODy'+JSON.stringify(request.body));
  const { pass ,pass2, user}=request.body;
  let updateQuerryPass='UPDATE salesforce.contact SET '+
                 'password__c = \''+pass+'\', '+
                  'password2__c=\''+pass2+'\' '+
                  'WHERE sfid = $1';
                  console.log('update query'+updateQuerryPass);
  pool
  .query(updateQuerryPass,[user])
  .then((querryResult)=>{
    console.log('querryResult'+JSON.stringify(querryResult));
    response.send('DOne');
  })
  .catch((queryyError)=>{
    console.log('queryyError'+queryyError.stack);
    response.send('queryyError');
   })
})

router.get('/editProfile',verify,(request,response)=>{
  let objUser=request.user;
  let userId=objUser.sfid;
  console.log('Sfidddd :'+JSON.stringify(objUser));
  let queryContact = 'SELECT sfid,email,  postal_code__c,address__c,name FROM salesforce.contact where sfid=$1' ;
  pool
  .query(queryContact,[userId])
  .then((queryResult)=>{
    let userdetail=queryResult.rows[0];
    console.log('userdeat '+JSON.stringify(userdetail));
 /*    console.log('queryResult'+JSON.stringify(queryResult.rows));
    let obj = queryResult.rows;
    console.log('check'+JSON.stringify(obj[0]));
    let user =JSON.stringify(obj[0]); 
    console.log('user '+user);
    response.render('editProfile',{userI}); */
    response.render('editProfile',{userdetail, objUser});
  })
  .catch((QueryError)=>{
    console.log('QueryError'+QueryError.stack);
    response.send(QueryError);
  })
})
router.post('/updateProfile',(request,response)=>{
  
  /*  const errors = validationResult(req);
   if(!errors.isEmpty()){
     return res.status(422).JSON({errors:errors.array()})
   } */
 // request.checkQuery('postal','"Postal Code should not  be empty ').notEmpty().isInt();
  let bdy= request.body;
   const schema = joi.object({
    postal: joi.number().max(999999).min(100000),
   /*
    nam:joi.string().min(4).max(20)
    phn:joi.string().required(),
    add:joi.string(),
    uid:joi.string(), */
  }) 
 // const scema = joi.number().max(5);
  let result= schema.validate({postal:bdy.postal});
  console.log('resutk '+JSON.stringify(result));
  if(result.error){
    response.status(400).send(result.error.details[0].message)
    return;
    } 
  console.log('body : '+ JSON.stringify(bdy));
  const {nam , phn, postal,add,uid }=request.body;
  console.log('name '+nam);
  console.log('phn '+phn);
  console.log('napostalme '+postal);
  console.log('add '+add);
  console.log('uid '+uid);
  let qry ='UPDATE salesforce.contact SET '+
            'postal_code__c=\''+postal+'\', '+
            'address__c=\''+add+'\' '+
             'WHERE sfid = $1';
             console.log('qry '+qry);
  pool
  .query(qry ,[uid])
  .then((querryResult)=>{
    console.log('querryResult'+JSON.stringify(querryResult));
    response.send(querryResult);
  })
  .catch((qurryError)=>{
    console.log('qrryError ' +qurryError.stack);
    response.send(qurryError);
  })

});
/* 
    TAsk Activity Code 
 */
router.get('/taskDetail',verify,(req,res)=>{
  console.log('calling Activity Code Page')
  res.render('taskCode');
})



router.get('/fetchTASKCODE',verify,(request,response)=>{

  pool.query('select sfid ,name from salesforce.Milestone1_Milestone__c where Project__c =$1 and sfid!=$2',['a030p0000018ScOAAU','a020p0000035q9lAAA'])
  .then((querryRes)=>{
    console.log('querryRes'+JSON.stringify(querryRes.rows));
    var sId=[];
    querryRes.rows.forEach((eachRecord)=>{
     // console.log(JSON.stringify(eachRecord.sfid));
      sId.push(eachRecord.sfid);
    })
    console.log('IDSET are :'+sId);
    let qry ='Select sfid ,Activity_Code__c FROM salesforce.Milestone1_Task__c where sfid IS NOT NULL AND Project_Milestone__c IN ($1,$2,$3,$4,$5,$6)';
    console.log('qry qry '+qry);
    pool.query(qry,[sId[0],sId[1],sId[2],sId[3],sId[4],sId[5]]) 
  ///  let qry='Select sfid ,Activity_Code__c FROM salesforce.Milestone1_Task__c where sfid IS NOT NULL AND Project_Milestone__c IN '+'('+ sId+')';
  //  console.log('qriesssss +'+ qry); 
 //   pool.query(qry,[sId])
    .then((result)=>{
      console.log('result TAsk '+ JSON.stringify(result));
      if(result.rowCount>0)
      {
        var modifiedList=[],i=1
        result.rows.forEach((eachRecord)=>{
          let obj={};
          obj.sequence=i;
          obj.taskId=eachRecord.sfid;
          obj.activityCode=eachRecord.activity_code__c;
          i=i+1;
          modifiedList.push(obj);
        })
        console.log('modified list '+JSON.stringify(modifiedList));
        response.send(modifiedList)
      }
      else
      {
        response('[]');
      }
    })
    .catch((error)=>{
      console.log('error'+error.stack);
      response.send(error);
    })
  })
  .catch((queryEr)=>{
    console.log('queryEr'+queryEr.stack);
    response.send(queryEr);
  })
})

router.get('/pldReports',verify,(request, response) => {
  let objUser = request.user;

  pool
  .query('SELECT sfid FROM salesforce.PldExcelReportVisibility__c WHERE Contact__c = $1 AND isShared__c = $2',[objUser.sfid, true])
  .then((excelReportResult) =>{
      console.log('excelReportResult  : '+JSON.stringify(excelReportResult.rows));
      if(excelReportResult.rowCount > 0)
      {
       response.render('./loginDashboard/pldReports',{objUser,showExcelReport : true});
      }
      else
      {
        response.render('./loginDashboard/pldReports',{objUser,showExcelReport : false});
      }
  })
  .catch((excelReportError) =>{
      console.log('excelReportError : '+excelReportError);
      response.render('./loginDashboard/pldReports',{objUser,showExcelReport : false});
  })

  
})


router.post('/sendResponseForApproval',verify, (request, response) => {
  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
  let reponseId = request.body.reponseId;
  console.log('reponseId   : '+reponseId);

  let managerId = '';
    pool
    .query('SELECT manager__c FROM salesforce.Team__c WHERE sfid IN (SELECT team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1)',[objUser.sfid])
    .then((teamMemberQueryResult) => {
          console.log('teamMemberQueryResult   : '+JSON.stringify(teamMemberQueryResult.rows));
          if(teamMemberQueryResult.rowCount > 0)
          {
            let lstManagerId = teamMemberQueryResult.rows.filter((eachRecord) => {
                                    if(eachRecord.manager__c != null)
                                        return eachRecord;
                              })
            managerId = lstManagerId[0].manager__c;
            console.log('managerId   : '+managerId);

            pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter__c, Assign_To__c ,Expense__c, Comment__c, Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['PldForm',objUser.sfid, managerId, reponseId, '', 'Pending', '', 0 ])
            .then((customApprovalQueryResult) => {
                    console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
                    response.send('Sent For Approval !');
            })
            .catch((customApprovalQueryError) => {
                    console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
                    response.send('Error Occured while sending for approval !');
            })
          }
    })
    .catch((teamMemberQueryError) => {
          console.log('teamMemberQueryError   :  '+teamMemberQueryError.stack);
          response.send('Error Occured while sending for approval !');
    })
});


router.post('/deletePldResponse',verify, (request, response) => {

  let objUser = request.user;
  console.log('objUser   : '+JSON.stringify(objUser));
  let reponseId = request.body.reponseId;
  console.log('reponseId  : '+reponseId);

  pool.query('DELETE FROM salesforce.Project_Survey_Response__c WHERE sfid = $1',[reponseId])
  .then((deleteResponseResult) => {
      console.log('deleteResponseResult  : '+JSON.stringify(deleteResponseResult));
      response.send('Deleted Successfully !');
  })
  .catch((deleteResponseError) => {
    console.log('deleteResponseError  : '+deleteResponseError.stack);
     response.send('Error Occured !');
  })

});


router.get('/getRelatedProjectLibraries',verify,(request, response)=> {

  let selectedProjectId = request.query.selectedProjectId;
  console.log('Inside Get Method selectedProjectId : '+selectedProjectId);

  pool
  .query('SELECT sfid, name,PLD_Questions__c FROM salesforce.Project_Library__c WHERE Project__c = $1 AND Active__c =$2',[selectedProjectId,true])
  .then((projectLibraryResult) => {
    console.log('projectLibraryResult  : '+JSON.stringify(projectLibraryResult.rows));
    if(projectLibraryResult.rowCount > 0)
    {
      response.send(projectLibraryResult.rows);
    }
    else
    {
      response.send([]);
    }
    

  })
  .catch((projectLibraryQueryError) => {
    console.log('projectLibraryQueryError  : '+projectLibraryQueryError);
    response.send([]);
  })

});




router.get('/getProjects',verify,(request, response) =>{

  
  let objUser = request.user;
  console.log('objUser  '+JSON.stringify(objUser));

  if(objUser.isManager ==  false)
  {
    pool
    .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[objUser.sfid])
    .then(teamMemberResult => {
      console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
      console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
      console.log('Number of Team Member '+teamMemberResult.rows.length);
      
      var projectTeamparams = [], lstTeamId = [];
      for(var i = 1; i <= teamMemberResult.rows.length; i++) {
        projectTeamparams.push('$' + i);
        lstTeamId.push(teamMemberResult.rows[i-1].team__c);
      } 
      var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
      console.log('projectTeamQueryText '+projectTeamQueryText);
      
        pool
        .query(projectTeamQueryText,lstTeamId)
        .then((projectTeamResult) => {
            console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
            console.log('projectTeam Name '+projectTeamResult.rows[0].name);

            var projectParams = [], lstProjectId = [];
            for(var i = 1; i <= projectTeamResult.rows.length; i++) {
              projectParams.push('$' + i);
              lstProjectId.push(projectTeamResult.rows[i-1].project__c);
            } 
            console.log('lstProjectId  : '+lstProjectId);
            var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

            pool.
            query(projetQueryText, lstProjectId)
            .then((projectQueryResult) => { 
                  console.log('Number of Projects '+projectQueryResult.rows.length);
                  
                  
                  if(projectQueryResult.rowCount > 0)
                  {
                    response.send(projectQueryResult.rows);
                  }
                  else
                  {
                    response.send([]);
                  }
                
            })
            .catch((projectQueryError) => {
                  console.log('projectQueryError '+projectQueryError.stack);
                  response.send([]);
            })
         
        })
          .catch((projectTeamQueryError) =>{
            console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            response.send([]);
          })          
      })
      .catch((teamMemberQueryError) => {
      console.log('Error in team member query '+teamMemberQueryError.stack);
        response.send([]);
      })

  }
  else
  {

    pool
    .query('SELECT sfid, Name FROM salesforce.Team__c WHERE Manager__c = $1 ;',[objUser.sfid])
    .then(teamMemberResult => {
      
      
      var projectTeamparams = [], lstTeamId = [];
      for(var i = 1; i <= teamMemberResult.rows.length; i++) {
        projectTeamparams.push('$' + i);
        lstTeamId.push(teamMemberResult.rows[i-1].sfid);
      } 
      var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
      console.log('projectTeamQueryText '+projectTeamQueryText);
      
        pool
        .query(projectTeamQueryText,lstTeamId)
        .then((projectTeamResult) => {
            console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
            console.log('projectTeam Name '+projectTeamResult.rows[0].name);

            var projectParams = [], lstProjectId = [];
            for(var i = 1; i <= projectTeamResult.rows.length; i++) {
              projectParams.push('$' + i);
              lstProjectId.push(projectTeamResult.rows[i-1].project__c);
            } 
            console.log('lstProjectId  : '+lstProjectId);
            var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

            pool.
            query(projetQueryText, lstProjectId)
            .then((projectQueryResult) => { 
                  console.log('Number of Projects '+projectQueryResult.rows.length);
                  
                  
                  if(projectQueryResult.rowCount > 0)
                  {
                    response.send(projectQueryResult.rows);
                  }
                  else
                  {
                    response.send([]);
                  }
                  
                  


            })
            .catch((projectQueryError) => {
                  console.log('projectQueryError '+projectQueryError.stack);
                  response.send([]);
            })
         
        })
          .catch((projectTeamQueryError) =>{
            console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            response.send([]);
          })          
      })
      .catch((teamMemberQueryError) => {
      console.log('Error in team member query '+teamMemberQueryError.stack);
        response.send([]);
      })
  }

});


router.get('/getProjectReportsAccessbility',verify, (request, response) =>{

  let objUser = request.user;

  pool
  .query('SELECT sfid, Project__c FROM salesforce.PldExcelReportVisibility__c WHERE Contact__c = $1 AND isShared__c = $2',[objUser.sfid, true])
  .then((excelReportResult) =>{
      console.log('excelReportResult  : '+JSON.stringify(excelReportResult.rows));
      if(excelReportResult.rowCount > 0)
      {
        let projectIdParams = [], lstProjectIds = [],i=1;
        excelReportResult.rows.forEach((eachRecord) => {
            projectIdParams.push('$'+i);
            lstProjectIds.push(eachRecord.project__c);
            i++;
        })

        let projectQueryText = 'SELECT id, sfid, name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+projectIdParams.join(',')+')';
        pool
        .query(projectQueryText,lstProjectIds)
        .then((projectQueryResult) => {
          console.log('Number of Projects '+projectQueryResult.rows.length);
          if(projectQueryResult.rowCount > 0)
          {
            response.send(projectQueryResult.rows);
          }
          else
          {
            response.send([]);
          }

        })
        .catch((projectQueryError) => {
          console.log('projectQueryError  : '+projectQueryError);
          response.send([]);
        })


      }
      else
      {
        response.send([]);
      }
  })
  .catch((excelReportError) =>{
      console.log('excelReportError : '+excelReportError);
      response.send([]);
  })

});


 module.exports = router;