const express = require('express');
//const router = express.Router();
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Router = require('express-promise-router');
const format = require('pg-format');
const joi = require('@hapi/joi');
const { request, response } = require('express');
const router = new Router()

router.get('/testQuery',(resquest, response) => {

  pool.query('SELECT exp.sfid,  exp.Project_Name__c, pro.name as proname,exp.Name as expName FROM salesforce.Milestone1_Expense__c as exp JOIN salesforce.Milestone1_Project__c as pro ON exp.Project_name__c = pro.sfid')
  .then((testQueryResult) => {
      response.send(testQueryResult.rows);
  })
  .catch((testQueryError) => {
    response.send(testQueryError.stack);
  })

});

router.get('/',verify, async (request, response) => {

    console.log('Expense request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid; 
    var objUser = request.user;
    console.log('Expense userId : '+userId);

    /* var objProjectList = [];

    await
    pool
  .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
  .then(contactResult => {
    console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
    var contactId = contactResult.rows[0].sfid;
      pool
      .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[userId])
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
                    console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                    var projectList = projectQueryResult.rows;
                    objProjectList = projectQueryResult.rows;
                    var lstProjectId = [], projectParams = [];
                    var j = 1;
                    projectList.forEach((eachProject) => {
                      console.log('eachProject sfid : '+eachProject.sfid);
                      lstProjectId.push(eachProject.sfid);
                      projectParams.push('$'+ j);
                      console.log('eachProject name : '+eachProject.name);
                      j++;
                    });


                  var taskQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Task__c  WHERE Project_Name__c IN ('+projectParams.join(',')+') AND  Project_Milestone__c IN (SELECT sfid FROM salesforce.Milestone1_Milestone__c WHERE Name = \'Timesheet Category\') AND sfid IS NOT NULL';
                  console.log('taskQueryText  : '+taskQueryText);



                    pool
                    .query(taskQueryText, lstProjectId)
                    .then((taskQueryResult) => {
                        console.log('taskQueryResult  rows '+taskQueryResult.rows.length);
                       // response.send({projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                    })
                    .catch((taskQueryError) => {
                        console.log('taskQueryError : '+taskQueryError.stack);
                       // response.send({projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                    })
                    
              })
              .catch((projectQueryError) => {
                    console.log('projectQueryError '+projectQueryError.stack);
              })
           
          })
            .catch((projectTeamQueryError) =>{
              console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            })          
        })
        .catch((teamMemberQueryError) => {
        console.log('Error in team member query '+teamMemberQueryError.stack);
        })

      }) 
      .catch(contactQueryError => console.error('Error executing contact query', contactQueryError.stack));


    await
    pool
    .query('SELECT id, sfid, Name , Project_Name__c, Approval_Status__c, Amount_Claimed__c, petty_cash_amount__c, Conveyance_Amount__c, Tour_bill_claim_Amount__c FROM salesforce.Milestone1_Expense__c WHERE Incurred_By_Heroku_User__c = $1 AND sfid != \'\'',[userId])
    .then((expenseQueryResult) => {
        console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
            if(expenseQueryResult.rowCount > 0)
            {
                console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
                var projectIDs = [], projectIDparams = [];
                for(let i =1 ;i <= expenseQueryResult.rowCount ; i++)
                {
                    console.log('Inside For Loop ');
                    projectIDs.push(expenseQueryResult.rows[i-1].project_name__c);
                    projectIDparams.push('$'+i);
                }

                let projectQueryText = 'SELECT id, sfid , name FROM salesforce.Milestone1_Project__c WHERE sfid IN ( '+projectIDparams.join(',')+' )';
                console.log('projectQueryText  : '+projectQueryText);

                pool
                .query(projectQueryText,projectIDs)
                .then((projectQueryResult) => {
                    console.log('projectQueryResult  : '+JSON.stringify(projectQueryResult.rows));
                })
                .catch((projectQueryError) => {
                    console.log('projectQueryError   : '+projectQueryError.stack);
                })
                response.render('expense.ejs',{objUser : objUser, name : request.user.name, email : request.user.email, expenseList : expenseQueryResult.rows, projectList : objProjectList});
            }
            else
            {
                response.render('expense.ejs',{objUser: objUser, name : request.user.name, email : request.user.email, expenseList : expenseQueryResult.rows, projectList : objProjectList});
            }
    })
    .catch((expenseQueryError) => {
        console.log('expenseQueryError   '+expenseQueryError.stack);
        response.send(403);
    }) */

    response.render('./expenses/expense.ejs',{objUser : objUser, name : request.user.name, email : request.user.email});
  
});


router.get('/expenseAllRecords',verify, async (request, response) => {

  let objUser = request.user;
  console.log('objUser   : '+JSON.stringify(objUser));

  pool
  .query('SELECT exp.id, exp.sfid, exp.Name , exp.isHerokuEditButtonDisabled__c, exp.Project_Name__c, exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.createddate, pro.sfid as prosfid, pro.name as proname FROM salesforce.Milestone1_Expense__c as exp JOIN salesforce.Milestone1_Project__c as pro ON exp.Project_name__c = pro.sfid WHERE exp.Incurred_By_Heroku_User__c = $1 AND exp.sfid != \'\'',[objUser.sfid])
  .then((expenseQueryResult) => {
      console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
          if(expenseQueryResult.rowCount > 0)
          {
              console.log('expenseQueryResult   : '+JSON.stringify(expenseQueryResult.rows));
              var projectIDs = [], projectIDparams = [];
              for(let i =1 ;i <= expenseQueryResult.rowCount ; i++)
              {
                  console.log('Inside For Loop ');
                  projectIDs.push(expenseQueryResult.rows[i-1].project_name__c);
                  projectIDparams.push('$'+i);
              }

              let expenseList = [];
              for(let i=0 ; i < expenseQueryResult.rows.length; i++)
              {
                let obj = {};
                let crDate = new Date(expenseQueryResult.rows[i].createddate);
               // crDate = crDate.setHours(crDate.getHours() + 5);
               // crDate = crDate.setMinutes(crDate.getMinutes() + 30);
                let strDate = crDate.toLocaleString();
                obj.sequence = i+1;
                obj.name = '<a href="'+expenseQueryResult.rows[i].sfid+'" data-toggle="modal" data-target="#popup" class="expId" id="name'+expenseQueryResult.rows[i].sfid+'"  >'+expenseQueryResult.rows[i].name+'</a>';
                obj.projectName = expenseQueryResult.rows[i].proname;
                obj.approvalStatus = expenseQueryResult.rows[i].approval_status__c;
                obj.totalAmount = '<span id="amount'+expenseQueryResult.rows[i].sfid+'" >'+expenseQueryResult.rows[i].amount_claimed__c+'</span>';
                obj.pettyCashAmount = expenseQueryResult.rows[i].petty_cash_amount__c;
                obj.conveyanceVoucherAmount = expenseQueryResult.rows[i].conveyance_amount__c;
                obj.createdDate = strDate;
                obj.print='<button    data-toggle="modal" data-target="#popupPrint" class="btn btn-primary printexp"   id="print'+expenseQueryResult.rows[i].sfid+'" >Print</button>';
                if(expenseQueryResult.rows[i].isherokueditbuttondisabled__c)
                  obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode"   id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                else
                  obj.editButton = '<button    data-toggle="modal" data-target="#popupEdit" class="btn btn-primary expIdEditMode"   id="edit'+expenseQueryResult.rows[i].sfid+'" >Edit</button>';
                obj.approvalButton = '<button   class="btn btn-primary expIdApproval"  style="color:white;" id="'+expenseQueryResult.rows[i].sfid+'" >Approval</button>';
                expenseList.push(obj);
                /* disabled="'+expenseQueryResult.rows[i].isherokueditbuttondisabled__c+'" */
              }

              let successMessages = [];
              successMessages.push({s_msg : 'Expense Data Received'})
             request.flash({successs_msg : 'Expense Data Received'});
              response.send({objUser : objUser, expenseList : expenseList, successs_msg : 'Expense Data Received'});
          }
          else
          {
              response.send({objUser: objUser, expenseList : []});
          }
  })
  .catch((expenseQueryError) => {
      console.log('expenseQueryError   '+expenseQueryError.stack);
      response.send({objUser: objUser, expenseList : []});
  })

})

router.get('/fetchProjectforCreateNew', verify ,(request, response) => 
{

      console.log('hello i am inside Expense Project');
      console.log('Expense request.user '+JSON.stringify(request.user));
      var userId = request.user.sfid; 
      var projectName =''; 
      pool
      .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',[userId])
      .then(contactResult => 
        {
          console.log('Name of Contact  :: '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
          var contactId = contactResult.rows[0].sfid;                 
          pool
          .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[contactId])
          .then(teamMemberResult => 
            {
              console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
              console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
              console.log('Number of Team Member '+teamMemberResult.rows.length);
                var projectTeamparams = [], lstTeamId = [];
                for(var i = 1; i <= teamMemberResult.rows.length; i++) 
                 {
                   projectTeamparams.push('$' + i);
                  lstTeamId.push(teamMemberResult.rows[i-1].team__c);
                  } 
                var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
                console.log('projectTeamQueryText '+projectTeamQueryText);
                        
                 pool
                .query(projectTeamQueryText,lstTeamId)
                .then((projectTeamResult) => 
                   {
                     console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
                      console.log('projectTeam Name '+projectTeamResult.rows[0].name);
                
                      var projectParams = [], lstProjectId = [];
                      for(var i = 1; i <= projectTeamResult.rows.length; i++) 
                        {
                      projectParams.push('$' + i);
                      lstProjectId.push(projectTeamResult.rows[i-1].project__c);
                        } 
                      console.log('lstProjectId  : '+lstProjectId);
                      var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';
                
                        pool.
                        query(projetQueryText, lstProjectId)
                       .then((projectQueryResult) => 
                         { 
                          console.log('Number of Projects '+projectQueryResult.rows.length);
                          console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                          var projectList = projectQueryResult.rows;
                          var lstProjectId = [], projectParams = [];
                          var j = 1;
                          projectList.forEach((eachProject) => 
                           {
                            console.log('eachProject sfid : '+eachProject.sfid);
                           lstProjectId.push(eachProject.sfid);
                           projectParams.push('$'+ j);
                           console.log('eachProject name : '+eachProject.name);
                           j++;
                            })
                            response.send(projectQueryResult.rows);
                          })
                              .catch((projectQueryError) => 
                               {
                                console.log('projectQueryError '+projectQueryError.stack);
                               })
                             
                          })
                              .catch((projectTeamQueryError) =>
                              {
                                console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
                              })          
                          })
                              .catch((teamMemberQueryError) =>
                              {
                                 console.log('Error in team member query '+teamMemberQueryError.stack);
                              })
                  
                        }) 
                  
                        .catch((contactQueryError) => 
                          { 
                            console.error('Error executing contact query', contactQueryError.stack);
                          })
                        });
                   
                  
      
/* Project Query
                  pool
                  .query('Select sfid , Name FROM salesforce.Milestone1_Project__c WHERE Incurred_By_Heroku_User__c = $1 AND sfid != \'\'',[objUser.sfid])
                  .then((projectQueryResult) => {
                    console.log('projectQueryResult  : '+JSON.stringify(projectQueryResult.rows));
                    response.send(projectQueryResult.rows);

                  })
                  .catch((activityCodeQueryError) => {
                    console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                    response.send([]);
                  })
*/
router.post('/createExpense',(request, response) => {

   // var {expenseName, projectName} = request.body;
    console.log('request.body  '+JSON.stringify(request.body));

   const {taskname,proj ,department, empCategory, incurredBy} = request.body;
   console.log('taskname  '+taskname);
   console.log('proj  '+proj);
   console.log('department  '+department);
   console.log('empCategory  '+empCategory);
   console.log('incurredBy  '+incurredBy);

   const schema=joi.object({
    taskname:joi.string().required().label('Please Fill Expense Name'),
    proj:joi.string().required().label('Please choose Project'),
      })
let result=schema.validate({taskname,proj});
if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
}
  else{
    pool
    .query('INSERT INTO salesforce.Milestone1_Expense__c (name,project_name__c,department__c,Conveyance_Employee_Category_Band__c,Incurred_By_Heroku_User__c) values ($1,$2,$3,$4,$5)',[taskname,proj,department,empCategory,incurredBy])
    .then((expenseInsertResult) => {     
             console.log('expenseInsertResult.rows '+JSON.stringify(expenseInsertResult.rows));
             response.send('Successfully Inserted');
    })
    .catch((expenseInsertError) => {
         console.log('expenseInsertError   '+expenseInsertError.stack);
         response.send('Error');
    })
  }
   
 
});

router.get('/saved-expense-details',verify, async (request, response) => {

  let finaResponse = {};
  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
  finaResponse.objUser = objUser;


  let expenseId = request.query.expenseId;
  console.log('Hurrah expenseId '+expenseId);
  let expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name, proj.name as projname, proj.sfid as projId, exp.Department__c, exp.Designation__c, '+
    'exp.Conveyance_Employee_Category_Band__c,'+
    'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c '+
    'FROM salesforce.Milestone1_Expense__c exp '+
    'INNER JOIN salesforce.Milestone1_Project__c proj '+
    'ON exp.Project_Name__c =  proj.sfid '+  
    'WHERE exp.sfid = $1';

  await
  pool
  .query(expenseQueryText,[expenseId])
  .then((expenseQueryResult) => {
      if(expenseQueryResult.rowCount > 0)
      {
        finaResponse.expenseDetails = expenseQueryResult.rows[0];
       
      }   
      else
        response.send({});
  })
  .catch((expenseQueryError) => {
        console.log('expenseQueryError  '+expenseQueryError.stack);
        response.send({});
  })

  await
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
          let projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

          pool.query(projetQueryText, lstProjectId)
          .then((projectQueryResult) => { 
                console.log('Number of Projects '+projectQueryResult.rows.length);
                finaResponse.projectList = projectQueryResult.rows;
                response.send(finaResponse);
           })
          .catch((projectQueryError) => {

           })
        })   
       .catch((projectTeamQueryError)=> {

       })
    })
    .catch((teamMemberQueryError) => {

    })


});

router.post('/update-expense',verify,(request, response) => {

  console.log('Expense request.user '+JSON.stringify(request.user));
  let objUser = request.user;
 

    let formBody = request.body;
    console.log('formBody  :'+JSON.stringify(formBody));
    const {taskname,projectname ,department, designation, employeeId, empCategory, approvalStatus, incurredBy, expenseId} = request.body;
   console.log('taskname  '+taskname);
   console.log('projectname  '+projectname);
   console.log('department  '+department);
   console.log('designation  '+designation);
   console.log('employeeId  '+employeeId);
   console.log('empCategory  '+empCategory);
   console.log('approvalStatus  '+approvalStatus);
   console.log('incurredBy  '+incurredBy);
   console.log('expense Id '+expenseId);

   let updateExpenseQuery = 'UPDATE salesforce.Milestone1_Expense__c SET '+
                             'name = \''+taskname+'\', '+
                             'project_name__c = \''+projectname+'\' , '+
                             'department__c = \''+department+'\' , '+
                             'designation__c = \''+designation+'\', '+
                             'Conveyance_Voucher_Employee_ID__c = \''+employeeId+'\' ,'+
                             'Conveyance_Employee_Category_Band__c = \''+empCategory+'\' ,'+
                             'Incurred_By_Heroku_User__c  = \''+incurredBy+'\' '+
                             'WHERE sfid = $1';
  console.log('updateExpenseQuery  '+updateExpenseQuery);

   pool
   .query(updateExpenseQuery,[expenseId])
   .then((expenseInsertResult) => {     
            console.log('expenseInsertResult.rows '+JSON.stringify(expenseInsertResult.rows));
            response.send('Success');
   })
   .catch((expenseInsertError) => {
        console.log('expenseInsertError   '+expenseInsertError.stack);
        response.send('Error');
   })

});


router.get('/expenseRecordDetails',(request, response) =>{

    var expenseId = request.query.expenseId;
    console.log('Hurrah expenseId '+expenseId);

});

router.get('/details', async (request, response) => {

  var expenseId = request.query.expenseId;
  console.log('Hurrah expenseId '+expenseId);

  var expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name, proj.name as projname, proj.sfid as projId, exp.Department__c, exp.Designation__c, '+
  ' exp.Conveyance_Employee_Category_Band__c,exp.Employee_ID__c, exp.Project_Manager_Status__c, exp.Accounts_Status__c , '+
  'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.Tour_Bill_Claim__c FROM salesforce.Milestone1_Expense__c exp '+
  'INNER JOIN salesforce.Milestone1_Project__c proj '+
  'ON exp.Project_Name__c =  proj.sfid '+
  'WHERE exp.sfid = $1';


  var pettyCashQueryText = 'SELECT id, sfid, name, Activity_Code__c, Bill_No__c, Bill_Date__c,Nature_of_exp__c, Amount__c FROM salesforce.Petty_Cash_Expense__c WHERE Expense__c = $1';
  var conveyanceQueryText = 'SELECT id, sfid, Name, Amount__c, Mode_of_Conveyance__c, From__c FROM salesforce.Conveyance_Voucher__c WHERE Expense__c = $1';
  var tourBillClaimQueryText = 'SELECT id, sfid, Name, Grand_Total__c,Grand__c FROM salesforce.Tour_Bill_Claim__c WHERE Expense__c = $1 ';
  
  var objData =  {};

  try{

      await pool.query(expenseQueryText,[expenseId])
      .then((expenseQueryResult) => {
              console.log('Expense Result '+JSON.stringify(expenseQueryResult.rows));
              objData.Expense = expenseQueryResult.rows;
      })
      .catch(expenseQueryError => console.log('expenseQueryError   :'+expenseQueryError.stack))


      await pool.query(pettyCashQueryText,[expenseId])
      .then(pettyCashQueryResult => {console.log('Petty Cash Result '+JSON.stringify(pettyCashQueryResult.rows))
              objData.PettyCash = pettyCashQueryResult.rows;
      })
      .catch(pettyCashQueryError => console.log('pettyCashQueryError  : '+pettyCashQueryError.stack))
      
      await pool.query(conveyanceQueryText,[expenseId])
      .then((conveyanceQueryResult) => {
              console.log('Conveyance Result '+JSON.stringify(conveyanceQueryResult.rows));
              objData.Conveyance = conveyanceQueryResult.rows;
      })
      .catch(conveyanceQueryError => console.log('conveyanceQueryError   :'+conveyanceQueryError.stack))

      await pool.query(tourBillClaimQueryText,[expenseId])
      .then((tourBillClaimResult) => {
          console.log('Tour BillClaim Result '+JSON.stringify(tourBillClaimResult.rows));
          objData.TourBillClaim = tourBillClaimResult.rows;
      })
      .catch(tourBillClaimQueryError => console.log('tourBillClaimQueryError   :'+tourBillClaimQueryError.stack))
    
     
  }
  catch(err){
      console.log('error async await '+err);
  }

  console.log('objData '+JSON.stringify(objData));
  response.send(objData);
});


router.get('/printdetails',async(request,response)=>{
  var expenseId = request.query.expenseId;
    console.log('Hurrah expenseId '+expenseId);
    var tourBillClaimId=[];
    var tourBillCaimParam=[];
    var airRailBusQuery='';
    var conveyanceChargeQuery='';
    var boardinglodgingQuery='';
    var telephoneFoodQuery='';
    var miscellaneousQuery='';
    var expenseQueryText = 'SELECT exp.id,exp.sfid,exp.Name, proj.name as projname, proj.sfid as projId, exp.Department__c, exp.Designation__c, '+
    ' exp.Conveyance_Employee_Category_Band__c,exp.Employee_ID__c, exp.Project_Manager_Status__c, exp.Accounts_Status__c , '+
    'exp.Approval_Status__c, exp.Amount_Claimed__c, exp.petty_cash_amount__c, exp.Conveyance_Amount__c, exp.Tour_Bill_Claim__c FROM salesforce.Milestone1_Expense__c exp '+
    'INNER JOIN salesforce.Milestone1_Project__c proj '+
    'ON exp.Project_Name__c =  proj.sfid '+  
    'WHERE exp.sfid = $1';
     var pettyCashQueryText = 'SELECT petty.sfid as sfid, petty.name as name, petty.Activity_Code_Project__c, petty.Bill_No__c,act.name as actname, petty.Bill_Date__c,petty.Nature_of_exp__c, petty.Amount__c '+
    'FROM salesforce.Petty_Cash_Expense__c petty '+
    'INNER JOIN salesforce.Activity_Code__c act ON petty.Activity_Code_Project__c = act.sfid '+
    'WHERE Expense__c = $1';  
    console.log('jdcj '+pettyCashQueryText);
    var conveyanceQueryText = 'SELECT  con.sfid, con.Name as name, con.Amount__c, con.Mode_of_Conveyance__c, con.From__c,con.To__c,con.Kms_Travelled__c,act.name as actname '+
    'FROM salesforce.Conveyance_Voucher__c con '+
    'INNER JOIN salesforce.Activity_Code__c act ON con.Activity_Code_Project__c = act.sfid '+
    'WHERE Expense__c = $1';
    var tourBillClaimQueryText = 'SELECT id, sfid, Name, Grand_Total__c,Grand__c FROM salesforce.Tour_Bill_Claim__c WHERE Expense__c = $1 ';
    
    var objData =  {};
    try{

      await pool.query(expenseQueryText,[expenseId])
      .then((expenseQueryResult) => {
              console.log('Expense Result '+JSON.stringify(expenseQueryResult.rows));
              objData.Expense = expenseQueryResult.rows;
      })
      .catch(expenseQueryError => console.log('expenseQueryError   :'+expenseQueryError.stack))


      await pool.query(pettyCashQueryText,[expenseId])
      .then(pettyCashQueryResult => {console.log('Petty Cash Result '+JSON.stringify(pettyCashQueryResult.rows))
              objData.PettyCash = pettyCashQueryResult.rows;
      })
      .catch(pettyCashQueryError => console.log('pettyCashQueryError  : '+pettyCashQueryError.stack))
      
      await pool.query(conveyanceQueryText,[expenseId])
      .then((conveyanceQueryResult) => {
              console.log('Conveyance Result '+JSON.stringify(conveyanceQueryResult.rows));
              objData.Conveyance = conveyanceQueryResult.rows;
      })
      .catch(conveyanceQueryError => console.log('conveyanceQueryError   :'+conveyanceQueryError.stack))

      await pool.query(tourBillClaimQueryText,[expenseId])
      .then((tourBillClaimResult) => {
          console.log('Tour BillClaim Result '+JSON.stringify(tourBillClaimResult.rows));
          objData.TourBillClaim = tourBillClaimResult.rows;
          for(var i=1;i<=tourBillClaimResult.rowCount;i++){
            tourBillCaimParam.push('$'+i);
            tourBillClaimId.push(tourBillClaimResult.rows[i-1].sfid);
          }
          console.log('tourBillCaimParam '+tourBillCaimParam+'  @tourBillClaimId'+tourBillClaimId );
          airRailBusQuery = 'SELECT air.sfid, air.Name as name, air.Departure_Date__c, air.Arrival_Date__c,air.Departure_Station__c,'+ 
          'air.Arrival_Station__c,air.Amount__c, Tour_Bill_Claim__c, Activity_Code_Project__c,act.name as actname, tour.name as tourname '+
          'FROM salesforce.Air_Rail_Bus_Fare__c air '+
          'INNER JOIN salesforce.Activity_Code__c act ON air.Activity_Code_Project__c = act.sfid '+
          'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON air.Tour_Bill_Claim__c = tour.sfid '+
          'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           console.log('airRailBusQuery '+airRailBusQuery);
           // Conveyance charge Query Result
           conveyanceChargeQuery='SELECT conch.sfid,conch.Name as name,conch.Date__c,conch.Amount__c,conch.Place__c,'+ 
           'conch.Remarks__c,act.name as actname,tour.name as tourname,conch.Project_Tasks__c '+
           'FROM salesforce.Conveyance_Charges__c conch '+
           'INNER JOIN salesforce.Activity_Code__c act ON conch.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON conch.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           // boardinglodgingQuery query  
           boardinglodgingQuery='SELECT board.sfid, board.Name as name,board.Stay_Option__c,board.Place_Journey__c,board.Correspondence_City__c,board.Activity_Code_Project__c,board.Own_Stay_Amount__c,board.Project_Tasks__c ,board.From__c,board.To__c,'+
           'board.No_of_Days__c,board.Daily_Allowance__c,board.Amount_of_B_L_as_per_policy__c,board.Total_time__c, board.Actual_Amount_for_boarding_and_lodging__c,board.Amount_for_boarding_and_lodging__c, '+
           'board.Total_Amount__c,board.Extra_Amount__c,board.Total_Allowance__c, act.name as actname,tour.name as tourname '+
           'FROM salesforce.Boarding_Lodging__c board '+
           'INNER JOIN salesforce.Activity_Code__c act ON board.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON board.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           console.log('boardinglodgingQuery '+boardinglodgingQuery);

           telephoneFoodQuery='SELECT telephn.sfid,telephn.Name as name, telephn.Laundry_Expense__c,telephn.Fooding_Expense__c,telephn.Remarks__c,'+ 
           'telephn.Total_Amount__c, act.name as actname,tour.name as tourname '+
           'FROM salesforce.Telephone_Fooding_Laundry_Expenses__c telephn '+
           'INNER JOIN salesforce.Activity_Code__c act ON telephn.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON telephn.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';

           miscellaneousQuery='SELECT misc.sfid,misc.Name,misc.Date__c,misc.Amount__c,misc.Particulars_Mode__c,'+ 
           'misc.Remarks__c,misc.Tour_Bill_Claim__c,act.name as actname,tour.name as tourname '+
           'FROM salesforce.Miscellaneous_Expenses__c misc '+
           'INNER JOIN salesforce.Activity_Code__c act ON misc.Activity_Code_Project__c = act.sfid '+
           'INNER JOIN salesforce.Tour_Bill_Claim__c tour ON misc.Tour_Bill_Claim__c = tour.sfid '+
           'WHERE Tour_Bill_Claim__c IN ('+ tourBillCaimParam.join(',')+ ')';
           
      })
      .catch(tourBillClaimQueryError => console.log('tourBillClaimQueryError   :'+tourBillClaimQueryError.stack))
    
      await pool.query(airRailBusQuery,tourBillClaimId)
      .then((airRailBusQueryResult) => {
              console.log('airRailBusQueryResult Result '+JSON.stringify(airRailBusQueryResult.rows));
              objData.airRailBus = airRailBusQueryResult.rows;
      })
      .catch(airRailBusQueryerror => console.log('airRailBusQueryerror   :'+airRailBusQueryerror.stack))

      await pool.query(conveyanceChargeQuery,tourBillClaimId)
      .then((conveyanceChargeQueryResult) => {
              console.log('conveyanceChargeQueryResult Result '+JSON.stringify(conveyanceChargeQueryResult.rows));
              objData.conveyanceCharge = conveyanceChargeQueryResult.rows;
      })
      .catch(conveyanceChargeQueryError => console.log('conveyanceChargeQueryError   :'+conveyanceChargeQueryError.stack))

      await pool.query(boardinglodgingQuery,tourBillClaimId)
      .then((boardinglodgingQueryResut) => {
              console.log('boardinglodgingQueryResut Result '+JSON.stringify(boardinglodgingQueryResut.rows));
              objData.boarding = boardinglodgingQueryResut.rows;
      })
      .catch(boardinglodgingQueryError => console.log('boardinglodgingQueryError   :'+boardinglodgingQueryError.stack))


      await pool.query(telephoneFoodQuery,tourBillClaimId)
      .then((telephoneFoodQueryresult) => {
              console.log('telephoneFoodQueryresult Result '+JSON.stringify(telephoneFoodQueryresult.rows));
              objData.telephone= telephoneFoodQueryresult.rows;
      })
      .catch(telephoneFoodQueryerror => console.log('telephoneFoodQueryerror   :'+telephoneFoodQueryerror.stack))

      await pool.query(miscellaneousQuery,tourBillClaimId)
      .then((miscellaneousQueryresult) => {
              console.log('miscellaneousQueryresult Result '+JSON.stringify(miscellaneousQueryresult.rows));
              objData.miscell= miscellaneousQueryresult.rows;
      })
      .catch(miscellaneousQueryerror => console.log('miscellaneousQueryerror   :'+miscellaneousQueryerror.stack))


     
  }
  catch(err){
      console.log('error async await '+err);
  }
  console.log('objData '+JSON.stringify(objData));
  response.send(objData);

})




var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|PNG|JPG|GIF)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

console.log('process.env.CLOUD_NAME  : '+process.env.CLOUD_NAME);
console.log('process.env.API_ID  : '+process.env.API_ID);
console.log('process.env.API_SECRET  : '+process.env.API_SECRET);

var upload = multer({ storage: storage, fileFilter: imageFilter})
cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET
}); 




router.get('/pettyCash/:parentExpenseId',verify,(request, response) => {

  var parentExpenseId = request.params.parentExpenseId;
  console.log('parentExpenseId  '+parentExpenseId);
  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var objUser = request.user;
  console.log('Expense userId : '+userId);

  response.render('expenses/pettyCash/pettycash',{objUser, parentExpenseId:parentExpenseId });
});



router.post('/savePettyCashForm', (request, response) => {

  console.log('Body Result '+JSON.stringify(request.body));  
  console.log('Now For Each   lllllllllLoop !');
  console.log('Hello Work done !');
  
   /* const schema = joi.object({
    bill_no:joi.string().required().label('Please provode Bill NO'),
    bill_date:joi.date().max('now').label('Please Fill Bill Date less than Today'),
    amount:joi.number().required().label('Amount cannot be Null'),
    imgpath:joi.string().invalid('demo').required().label('Upload your File/Attachments'),
   })
   let result = schema.validate({bill_no:request.body.bill_no,amount:request.body.amount,bill_date:request.body.bill_date,imgpath:request.body.imgpath})
   if(result.error)
   {
     console.log('ejssssss VAlidation'+JSON.stringify(result.error));
     response.send(result.error.details[0].context.label);
     return;
   } */

    let numberOfRows,lstPettyCash = [];
    if(typeof(request.body.bill_no) == 'object')
    {
         numberOfRows = request.body.bill_no.length;           
          for(let i=0; i< numberOfRows ; i++)
          {
            const schema = joi.object({
          //  bill_no:joi.string().required().label('Please provode Bill NO'),
              bill_dt:joi.date().required().label('Please Fill Bill Date.'),
              bill_date:joi.date().max('now').label('Please Fill Bill Date less than Today'),
              projectTask:joi.string().required().label('Select Activity Code '),
              nature_exp : joi.string().required().label('Please fill nature of expense '),
              amount:joi.number().required().label('Amount cannot be Null'),
              imgpath:joi.string().invalid('demo').required().label('Upload your File/Attachments'),
             })
             let result = schema.validate({amount:request.body.amount[i],bill_dt:request.body.bill_date[i] ,bill_date:request.body.bill_date[i],projectTask : request.body.projectTask[i],nature_exp: request.body.nature_exp[i] , imgpath:request.body.imgpath[i]})
             if(result.error)
             {
               console.log('ejssssss VAlidation'+JSON.stringify(result.error));
               response.send(result.error.details[0].context.label);
               return;
             }
             else{

              
               
              let pettyCashValues = [];
             /*  if(typeof(request.body.bill_no) == 'undefined' || request.body.bill_no == '')
              pettyCashValues.push('');
            else
              pettyCashValues.push(request.body.bill_no[i]); */
              pettyCashValues.push(request.body.bill_no[i]);
              pettyCashValues.push(request.body.bill_date[i]);
              pettyCashValues.push(request.body.projectTask[i]);
              pettyCashValues.push(request.body.desc[i]);
              pettyCashValues.push(request.body.nature_exp[i]);
              pettyCashValues.push(request.body.amount[i]);
              pettyCashValues.push(request.body.imgpath[i]);
              pettyCashValues.push(request.body.parentExpenseId[i]);
              lstPettyCash.push(pettyCashValues);
             }
          }    
          console.log('lstPettyCash  '+JSON.stringify(lstPettyCash));
    }
    else
    { 
      const schema = joi.object({
     //   bill_no:joi.string().required().label('Please provode Bill NO'),
        bill_dt:joi.date().required().label('Please Fill Bill Date.'),
        bill_date:joi.date().max('now').label('Please Fill Bill Date less than Today'),
        projectTask:joi.string().required().label('Select Activity Code '),
        nature_exp : joi.string().required().label('Please fill nature of expense '),
        amount:joi.number().required().label('Amount cannot be Null'),
        imgpath:joi.string().invalid('demo').required().label('Upload your File/Attachments'),
       })
       let result = schema.validate({amount:request.body.amount,bill_dt:request.body.bill_date, bill_date:request.body.bill_date, projectTask:request.body.projectTask,nature_exp: request.body.nature_exp, imgpath:request.body.imgpath})
       if(result.error)
       {
         console.log('ejssssss VAlidation'+JSON.stringify(result.error));
         response.send(result.error.details[0].context.label);
         return;
       }
       else{

        numberOfRows = 1;
        for(let i=0; i< numberOfRows ; i++)
        {
            let pettyCashValues = [];
         /*    if(typeof(request.body.bill_no) == 'undefined' || request.body.bill_no == '')
              pettyCashValues.push('');
            else
              pettyCashValues.push(request.body.bill_no); */
            pettyCashValues.push(request.body.bill_no);
            pettyCashValues.push(request.body.bill_date);
            pettyCashValues.push(request.body.projectTask);
            pettyCashValues.push(request.body.desc);
            pettyCashValues.push(request.body.nature_exp);
            pettyCashValues.push(request.body.amount);
            pettyCashValues.push(request.body.imgpath);
            pettyCashValues.push(request.body.parentExpenseId);
            lstPettyCash.push(pettyCashValues);
            
        }

       }    
        console.log('lstPettyCash  '+JSON.stringify(lstPettyCash));
    }
    
    
    let pettyCashInsertQuery = format('INSERT INTO salesforce.Petty_Cash_Expense__c (bill_no__c, bill_date__c,Activity_Code_Project__c,description_of_activity_expenses__c,nature_of_exp__c,amount__c,heroku_image_url__c,expense__c) VALUES %L returning id', lstPettyCash);

    console.log('pettyCashInsertQuery   '+pettyCashInsertQuery);
    pool.query(pettyCashInsertQuery)
    .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
        response.send('Petty Cash Form Saved Succesfully !');
    })
    .catch((pettyCashQueryError) => {
      console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
      response.send('Error Occured !');
    })
  
});

router.post('/uploadImage',upload.any(),async (request, response) => {

    console.log('uploadImage  Called !');
    console.log('request.files[0].path   '+request.files[0].path);
    try{
    cloudinary.uploader.upload(request.files[0].path, function(error, result) {
 
        if(error){
          console.log('cloudinary  error' + error);
        }
        console.log('cloudinary result '+JSON.stringify(result));
        response.send(result);
      });
   }
   catch(Ex)
   {
        console.log('Exception '+ex);
        console.log('Exception '+JSON.stringify(ex));
   }
});



router.get('/conveyanceVoucher/:parentExpenseId',verify,(request, response) => {

  var parentExpenseId = request.params.parentExpenseId;
  console.log('conveyanceVoucher parentExpenseId '+parentExpenseId);
  console.log('Expense request.user '+JSON.stringify(request.user));
  var userId = request.user.sfid; 
  var objUser = request.user;
  console.log('Expense userId : '+userId);

  response.render('expenses/conveyanceVoucher/conveyanceVoucher',{objUser, parentExpenseId: parentExpenseId });

});

router.post('/conveyanceform',(request,response) => {  
  let body = request.body;
    console.log('conveyanceform Body Result  : '+JSON.stringify(request.body));
  /*  const schema=joi.object({
    activity_code:joi.required(),
    to:joi.date().max('now').required().label('To date can not exceed Today'),
    from:joi.date().less(joi.ref('to')).required().label('From date must be less tha To date'),
    purposeoftravel:joi.required().label('Please mention Purpose of Travell'),
    amount:joi.number().required().label('Amount cannot be null'), 
    kmtravelled:joi.number().required().label('Enter how Much You Travell'),
    imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachment '),
   })
   let result=schema.validate(request.body);
   console.log('sdjabsdjb'+JSON.stringify(result));
   if(result.error)
   {
    console.log(' VAlidation'+JSON.stringify(result.error));
    response.send(result.error.details[0].context.label);
   } */

    let numberOfRows ,lstConveyance = [];
    if(typeof(request.body.from) == 'object')
    {
        numberOfRows = request.body.from.length;
        for(let i=0; i<numberOfRows ; i++)
        {
          const schema=joi.object({
            
            fromBlank:joi.date().required().label('From date cannot be empty'),
            toBlank:joi.date().required().label('To date cannot be empty'),
            to:joi.date().max('now').label('To date can not exceed Today'),
            from:joi.date().less(joi.ref('to')).label('From date must be less tha To date'),
            projectTask: joi.string().required().label('Select Your ActivityCode'),
            purposeoftravel:joi.string().required().label('Please mention Purpose of Travell'),
            modeofconveyance: joi.string().required().label('Please mention mode of conveyance'),
            kmtravelled:joi.number().required().label('Enter how Much You Travell'),
            amount:joi.number().required().label('Amount cannot be null'), 
            imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachment '),
           })
           let result=schema.validate({toBlank:body.to[i] ,to:body.to[i],fromBlank:body.from[i], from:body.from[i], projectTask: body.projectTask[i], purposeoftravel:body.purposeoftravel[i],modeofconveyance: body.modeofconveyance[i], amount:body.amount[i],kmtravelled:body.kmtravelled[i],imgpath:body.imgpath[i]});
           console.log('sdjabsdjb'+JSON.stringify(result));
           if(result.error)
           {
            console.log(' VAlidation'+JSON.stringify(result.error));
            response.send(result.error.details[0].context.label);
           } 
           else{
            let conveyanceValues = [];
            conveyanceValues.push(request.body.from[i]);
            conveyanceValues.push(request.body.to[i]);
            conveyanceValues.push(request.body.projectTask[i]);
            conveyanceValues.push(request.body.purposeoftravel[i]);
            conveyanceValues.push(request.body.modeofconveyance[i]);
            conveyanceValues.push(request.body.kmtravelled[i]);
            conveyanceValues.push(request.body.amount[i]);
            conveyanceValues.push(request.body.imgpath[i]);
            conveyanceValues.push(request.body.parentExpenseId[i]);
            lstConveyance.push(conveyanceValues);
           }
        }   
        console.log('lstConveyance   : '+lstConveyance);
    }
    else
    {
        numberOfRows = 1;
        for(let i=0; i<numberOfRows ; i++)
        {
          
          const schema=joi.object({
            
            fromBlank:joi.date().required().label('From date cannot be empty'),
            toBlank:joi.date().required().label('To date cannot be empty'),
            to:joi.date().max('now').label('To date can not exceed Today'),
            from:joi.date().less(joi.ref('to')).label('From date must be less tha To date'),
            projectTask: joi.string().required().label('Select Your ActivityCode'),
            purposeoftravel:joi.string().required().label('Please mention Purpose of Travell'),
            modeofconveyance: joi.string().required().label('Please mention mode of conveyance'),
            kmtravelled:joi.number().required().label('Enter how Much You Travell'),
            amount:joi.number().required().label('Amount cannot be null'), 
            
            imgpath:joi.string().invalid('demo').required().label('Please Upload File/Attachment '),
           })
           let result=schema.validate({toBlank:body.to,to:body.to,fromBlank:body.from, from:body.from,projectTask:body.projectTask, purposeoftravel:body.purposeoftravel,modeofconveyance:body.modeofconveyance,amount:body.amount,kmtravelled:body.kmtravelled,imgpath:body.imgpath});
           console.log('sdjabsdjb'+JSON.stringify(result));
           if(result.error)
           {
            console.log(' VAlidation'+JSON.stringify(result.error));
            response.send(result.error.details[0].context.label);
           } 
           else{
            let conveyanceValues = [];
            conveyanceValues.push(request.body.from);
            conveyanceValues.push(request.body.to);
            conveyanceValues.push(request.body.projectTask);
            conveyanceValues.push(request.body.purposeoftravel);
            conveyanceValues.push(request.body.modeofconveyance);
            conveyanceValues.push(request.body.kmtravelled);
            conveyanceValues.push(request.body.amount);
            conveyanceValues.push(request.body.imgpath);
            conveyanceValues.push(request.body.parentExpenseId);
            lstConveyance.push(conveyanceValues);
           }
        }   
        console.log('lstConveyance   : '+lstConveyance);
    }
    
    let conveyanceVoucherInsertQuery = format('INSERT INTO salesforce.Conveyance_Voucher__c (From__c, To__c,Activity_Code_Project__c,Purpose_of_Travel__c,Mode_of_Conveyance__c,Kms_Travelled__c,amount__c,heroku_image_url__c,expense__c) VALUES %L returning id', lstConveyance);
    console.log('conveyanceVoucherInsertQuery   '+conveyanceVoucherInsertQuery);
    pool.query(conveyanceVoucherInsertQuery)
    .then((conveyanceQueryResult) => {
        console.log('conveyanceQueryResult :  '+JSON.stringify(conveyanceQueryResult.rows));
        response.send('Conveyance Saved Successfully !');
    })
    .catch((conveyanceQueryError) => {
      console.log('conveyanceQueryError  '+conveyanceQueryError);
      response.send('Error Occured !');
    })
});


router.get('/addExpense', (request, response) => {
    response.render('expenseAddEditForm');
});


router.get('/activityCode', verify ,(request, response) => {

  console.log('hello i am inside');

  let objUser = request.user;

  console.log('objUser :' +JSON.stringify(objUser));

  let expenseId = request.query.parentExpenseId;
  
  console.log('parentId :' +expenseId)
  let projectId ;
 
  pool
  .query('SELECT sfid, project_name__c FROM salesforce.Milestone1_Expense__c WHERE  sfid = $1',[expenseId])
  .then((expenseQueryResult) => {
    console.log('expenseQueryResult :' +JSON.stringify(expenseQueryResult.rows));
    if(expenseQueryResult.rowCount > 0)
    {
      projectId = expenseQueryResult.rows[0].project_name__c;
      console.log('Inside ExpenseQuery  : '+projectId);
    
      pool
      .query('Select sfid , Name FROM salesforce.Activity_Code__c where Project__c = $1', [projectId])
       .then((activityCodeQueryResult) => {
        console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
        let numberOfRows, lstActivityCode =[];
        if(activityCodeQueryResult.rowCount > 0)
        {
          numberOfRows = activityCodeQueryResult.rows.length;
          for(let i=0; i< numberOfRows ; i++)
          {
            lstActivityCode.push(activityCodeQueryResult.rows[i]);
          }
          response.send(lstActivityCode);
        }
      })
      .catch((activityCodeQueryError) => {
        console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
        response.send([]);
      })
    }

    

  })
  .catch((expenseQueryError) => {
    console.log('expenseQueryError  : '+expenseQueryError.stack);
})

})




router.post('/sendForApproval',verify,(request, response) => {
    console.log('hekllo');
    let objUser = request.user;
    let expenseId = request.body.selectedExpenseId;
    let expenseName = request.body.expenseName;
    let totalAmount = request.body.totalAmount;
    let comment = request.body.comment;
    console.log('comment  :  '+comment);
    console.log('expenseId  :  '+expenseId+'  expenseName  : '+expenseName+'  totalAmount : '+totalAmount);

    let approvalStatus = 'Pending';
    let updateExpenseQuery = 'UPDATE salesforce.Milestone1_Expense__c SET '+  
                             'isHerokuEditButtonDisabled__c = true , '+
                             'approval_status__c = \''+approvalStatus+'\' '+
                             'WHERE sfid = $1';
     console.log('updateExpenseQuery :  '+updateExpenseQuery);

    pool.query(updateExpenseQuery,[expenseId])
    .then((expenseUpdateQueryResult) => {
          console.log('expenseUpdateQueryResult  : '+JSON.stringify(expenseUpdateQueryResult));
    })
    .catch((expenseUpdateQueryError) => {
          console.log('expenseUpdateQueryError  : '+expenseUpdateQueryError.stack);
    });


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

            pool.query('INSERT INTO salesforce.Custom_Approval__c (Approval_Type__c,Submitter__c, Assign_To__c ,Expense__c, Comment__c, Status__c, Record_Name__c,amount__c) values($1, $2, $3, $4, $5, $6, $7, $8) ',['Expense',objUser.sfid, managerId, expenseId, comment, 'Pending', expenseName, totalAmount ])
            .then((customApprovalQueryResult) => {
                    console.log('customApprovalQueryResult  '+JSON.stringify(customApprovalQueryResult));
            })
            .catch((customApprovalQueryError) => {
                    console.log('customApprovalQueryError  '+customApprovalQueryError.stack);
            })
          }
    })
    .catch((teamMemberQueryError) => {
          console.log('teamMemberQueryError   :  '+teamMemberQueryError.stack);
    })

    response.send('OKOKOK');

});

router.get('/pettycashlistview',verify,(request, response) => {

  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.query.expenseId;
  console.log('expenseId  '+expenseId);

  response.render('./expenses/pettyCash/pettycashlistview',{objUser,expenseId});
})


router.get('/getpettycashlist',verify,(request, response) => {

  let objUser = request.user;
  let expenseId = request.query.expenseId;
  console.log('expenseId  '+expenseId);
  pool
  .query('SELECT sfid, name, bill_no__c, Bill_Date__c ,Nature_of_exp__c ,createddate from salesforce.Petty_Cash_Expense__c WHERE expense__c = $1',[expenseId])
  .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
          if(pettyCashQueryResult.rowCount > 0)
          {
              //response.send(pettyCashQueryResult.rows);

              let modifiedPettyCashList = [],i =1;
              pettyCashQueryResult.rows.forEach((eachRecord) => {
                let obj = {};
                let createdDate = new Date(eachRecord.createddate);
                let strDate = createdDate.toLocaleString();
                let strBillDate = new Date(eachRecord.bill_date__c).toLocaleString();
                obj.sequence = i;
                obj.name = '<a href="#" class="pettyCashTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
                obj.billNo = eachRecord.bill_no__c;
                obj.natureOfExpense = eachRecord.nature_of_exp__c;
                obj.billDate = strBillDate.split(',')[0];
                obj.createDdate = strDate;

                i= i+1;
                modifiedPettyCashList.push(obj);
              })
              response.send(modifiedPettyCashList);
          }
          else
          {
              response.send([]);
          }
  })
  .catch((pettyCashQueryError) => {
        console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
        response.send([]);
  })

  console.log('objUser  : '+JSON.stringify(objUser));

})



router.get('/getpettycashDetail',verify,(request, response) => {

  let pettyCashId = request.query.pettyCashId;
  console.log('pettyCashId  : '+pettyCashId);
  let queryText = 'SELECT pettycash.sfid, act.name as activityCode, pettycash.Project_Tasks__c, pettycash.description_of_activity_expenses__c, pettycash.amount__c, pettycash.name as pettycashname ,exp.name as expname, pettycash.bill_no__c, pettycash.Bill_Date__c, pettycash.heroku_image_url__c ,pettycash.Nature_of_exp__c ,pettycash.createddate '+
                   'FROM salesforce.Petty_Cash_Expense__c pettycash '+ 
                   'INNER JOIN salesforce.Milestone1_Expense__c exp ON pettycash.Expense__c =  exp.sfid '+
                   'INNER JOIN salesforce.Activity_Code__c act ON pettycash.Activity_Code_Project__c= act.sfid '+
                   'WHERE  pettycash.sfid= $1 ';

  pool
  .query(queryText,[pettyCashId])
  .then((pettyCashQueryResult) => {
        console.log('pettyCashQueryResult  '+JSON.stringify(pettyCashQueryResult.rows));
        if(pettyCashQueryResult.rowCount > 0)
        {
          response.send(pettyCashQueryResult.rows);
        }
        else
        {
          response.send({});
        }
         
  })
  .catch((pettyCashQueryError) => {
        console.log('pettyCashQueryError  '+pettyCashQueryError.stack);
        response.send({});
  })

})
/*****  Anukarsh Conveyance ListView */

router.get('/ConveyanceListView',verify,(request, response) => {

  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.query.expenseId;
  console.log('expenseId  '+expenseId);

  response.render('./expenses/conveyanceVoucher/ConveyanceListView',{objUser,expenseId});
})

router.get('/getconveyancelist' ,verify,(request,response) => {
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.query.expenseId;
  console.log('expenseId conveyance '+expenseId);
  pool
  .query('SELECT sfid, name, Mode_of_Conveyance__c, Purpose_of_Travel__c ,createddate from salesforce.Conveyance_Voucher__c WHERE expense__c = $1',[expenseId])
  .then((conveyanceQueryResult)=>{
    console.log('conveyanceQueryResult :'+conveyanceQueryResult.rowCount);
    if(conveyanceQueryResult.rowCount>0)
    {
      let modifiedConveyanceList = [],i =1;
      
      conveyanceQueryResult.rows.forEach((eachRecord) => {
        let obj = {};
        let createdDate = new Date(eachRecord.createddate);
     //   let strDate = createdDate.toLocaleString();
        obj.sequence = i;
        obj.name = '<a href="#" class="conveyanceTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
        obj.TravellingPurpose = eachRecord.purpose_of_travel__c;
     //  obj.createDdate = strDate;
        obj.createDdate = eachRecord.createddate;
        obj.modeOfTravel = eachRecord.mode_of_conveyance__c;
        

        i= i+1;
        modifiedConveyanceList.push(obj);
      })
      response.send(modifiedConveyanceList);
    }
    else{
      response.send([]);
    }
    
  })
  .catch((conveyanceQueryError)=>{
    console.log('conveyanceQueryError'+conveyanceQueryError.stack);
  })
} )

router.get('/TourBillClaimListView',verify,(request,response)=>{
  let objUser = request.user;
  console.log('objUser  : '+JSON.stringify(objUser));
  let expenseId = request.query.expenseId;
  console.log('expenseId  '+expenseId);

  response.render('TourBillClaimListView',{objUser,expenseId});
})






router.get('/getConveyanceVoucherDetail',verify,(request, response) => {

  let  conveyanceId= request.query.conveyanceId;
  console.log('conveyanceId  : '+conveyanceId);
  let queryText = 'SELECT conVoucher.sfid, act.name as activityCode, conVoucher.amount__c, conVoucher.From__c, conVoucher.To__c, conVoucher.Kms_Travelled__c, conVoucher.mode_of_conveyance__c,conVoucher.purpose_of_travel__c, conVoucher.name as conveyancename ,exp.name as expname, conVoucher.Heroku_Image_URL__c, conVoucher.createddate '+
                   'FROM salesforce.Conveyance_Voucher__c conVoucher '+ 
                   'INNER JOIN salesforce.Milestone1_Expense__c exp ON conVoucher.expense__c =  exp.sfid '+
                   'INNER JOIN salesforce.Activity_Code__c act ON conVoucher.Activity_Code_Project__c= act.sfid '+
                   'WHERE  conVoucher.sfid= $1 ';

  pool
  .query(queryText,[conveyanceId])
  .then((conveyanceQueryResult) => {
        console.log('conveyanceQueryResult  '+JSON.stringify(conveyanceQueryResult.rows));
        if(conveyanceQueryResult.rowCount > 0)
        {
          response.send(conveyanceQueryResult.rows);
        }
        else
        {
          response.send({});
        }
         
  })
  .catch((conveyanceQueryError) => {
        console.log('conveyanceQueryError  '+conveyanceQueryError.stack);
        response.send({});
  })

})


router.get('/tourBillClaimActivityCode', verify ,(request, response) => {

  console.log('hello i am inside Tour Bill Claim Activity Code');

  let tourbillId = request.query.tourbillId;

  console.log('tourbillId :' +tourbillId)
  let expenseId;
  let projectId ;

              pool
              .query('SELECT sfid, Expense__c FROM salesforce.Tour_Bill_Claim__c WHERE  sfid = $1',[tourbillId])
              .then((tourBillClaimQueryResult) => {
                console.log('tourBillClaimQueryResult :' +JSON.stringify(tourBillClaimQueryResult.rows));
                expenseId = tourBillClaimQueryResult.rows[0].expense__c;
                if(tourBillClaimQueryResult.rowCount > 0)
                {
                  pool
                  .query('SELECT sfid, project_name__c FROM salesforce.Milestone1_Expense__c WHERE  sfid = $1',[expenseId])
                  .then((expenseQueryResult) => {
                    console.log('expenseQueryResult :' +JSON.stringify(expenseQueryResult.rows));
                    if(expenseQueryResult.rowCount > 0)
                    {
                      projectId = expenseQueryResult.rows[0].project_name__c;
                      console.log('Inside ExpenseQuery  : '+projectId);
                    
                      pool
                      .query('Select sfid , Name FROM salesforce.Activity_Code__c where Project__c = $1', [projectId])
                      .then((activityCodeQueryResult) => {
                        console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
                        let numberOfRows, lstActivityCode =[];
                        if(activityCodeQueryResult.rowCount > 0)
                        {
                          numberOfRows = activityCodeQueryResult.rows.length;
                          for(let i=0; i< numberOfRows ; i++)
                          {
                            lstActivityCode.push(activityCodeQueryResult.rows[i]);
                          }
                          response.send(lstActivityCode);
                        }
                      })
                      .catch((activityCodeQueryError) => {
                        console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                        response.send([]);
                      })
                    }
                  })
                  .catch((expenseQueryError) =>
                      {
                    console.log('expenseQueryError  : '+expenseQueryError.stack);
                     })
                    }
                })
         .catch((tourBillClaimQueryError) =>
              {
               console.log('tourBillClaimQueryError  : '+tourBillClaimQueryError.stack);
             })
  })







module.exports = router;