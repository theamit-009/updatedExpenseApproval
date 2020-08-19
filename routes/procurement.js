const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const format = require('pg-format');
const joi = require('@hapi/joi');
const Router = require('express-promise-router');
const { response, request } = require('express');
const { body } = require('express-validator');
const { json } = require('body-parser');
const router = new Router();

router.get('/',verify,(request, response)=> {
   
        let objUser=request.user;
        console.log('user '+objUser);  
        response.render('assetRequistionForms',{objUser});    
});

router.get('/assetDetails',verify,(request, response)=> {
    console.log('inside asset details');
    console.log('Asset request.user '+JSON.stringify(request.user));
    var userId = request.user.sfid;
    var objUser = request.user;
    console.log('Asset userId : '+userId);
    let qry ='SELECT asset.sfid, asset.Name, proj.name as projname, proj.sfid as projId, asset.Approval_Status__c, asset.Number_Of_IT_Product__c, asset.Number_Of_Non_IT_Product__c, asset.Procurement_IT_total_amount__c, asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c FROM  salesforce.Asset_Requisition_Form__c asset '+
             'INNER JOIN salesforce.Milestone1_Project__c proj '+
             'ON asset.project_department__c =  proj.sfid '+
             ' WHERE asset.Submitted_By_Heroku_User__c = $1'

    pool
    .query(qry,[userId])
    .then((assetQueryResult) => {
            console.log('assetQueryResult   '+assetQueryResult.rows);
            if(assetQueryResult.rowCount > 0)
            {
              let modifiedList = [];
            console.log('assetQueryResult   : '+JSON.stringify(assetQueryResult.rows));
            for(let i=0 ; i < assetQueryResult.rows.length; i++)
            {
                let obj = {};
              obj.sequence = i+1;
             // obj.editbutton = '<button    data-toggle="modal" data-target="#assetRequisitionEditModal" class="btn btn-primary assetRequisitionEditModalButton"   id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>';
              obj.editbutton = '<button href="#" class="btn btn-primary assetRequisitionEditModal" id="'+assetQueryResult.rows[i].sfid+'" >Edit</button>'
              obj.name = '<a href="'+assetQueryResult.rows[i].sfid+'" data-toggle="modal" data-target="#popup" class="assetTag" id="name'+assetQueryResult.rows[i].sfid+'"  >'+assetQueryResult.rows[i].name+'</a>';
              obj.projectname = assetQueryResult.rows[i].projname;
              obj.noit = assetQueryResult.rows[i].number_of_it_product__c;
              obj.nononit = assetQueryResult.rows[i].number_of_non_it_product__c;
              obj.itamount = assetQueryResult.rows[i].procurement_it_total_amount__c;
              obj.nonitamount = assetQueryResult.rows[i].procurement_non_it_total_amount__c;
              obj.totalamount = assetQueryResult.rows[i].total_amount__c;
              obj.approvalbutton = '<button href="#" class="btn btn-primary approvalpopup" id="'+assetQueryResult.rows[i].sfid+'" >Approval</button>'
              obj.accountsapprovalbutton = '<button href="#" class="btn btn-primary accountsapprovalpopup" id="'+assetQueryResult.rows[i].sfid+'" >Accounts Approval</button>'
              modifiedList.push(obj);
              }
              response.send(modifiedList);
              let successMessages = [];
              successMessages.push({s_msg : 'Asset Data Received'})
              request.flash({successs_msg : 'Asset Data Received'});
          }
          else
          {
              response.send([]);
          }
    })
    .catch((assetQueryError) => {
      console.log('assetQueryError   '+assetQueryError.stack);
      response.send({objUser: objUser, assetList : []});
    })
});

router.get('/assetEditDetails',verify ,async(request, response) =>{
   console.log('hii inside asset details');
    let assetId = request.query.assetId;
    console.log('assetId  '+assetId);
    let objUser = request.user;
    console.log('User:' +objUser);
    let qyr='SELECT asset.id, asset.sfid as sfid,asset.name as name ,asset.Activity_Code_Project__c, asset.GST__c,asset.Requested_Closure_Plan_Date__c,asset.Requested_Closure_Actual_Date__c,asset.Project_Department__c as pid, '+
    'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,asset.Committee_Approved_Counts__c,'+
    'asset.Comittee_Rejected_Count__c,asset.Procurement_Committee_Status__c,asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,asset.Approval_Status__c,'+
    'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid as profsfid,'+
    'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c,asset.P_O_attachment__c, '+
    'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
     'asset.P_O_attachment__c,po_attachment_url__c,payment_status__c,asset.status__c,asset.payment_received_acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c, '+
     'asset.if_3_quotations_specify_Reason__c,asset.reason_for_non_registered_GST_Vendor__c, asset.Pricing_Terms_Cost_comparison__c, asset.Delivery_Terms_Delivery_Place__c, asset.Delivery_Terms_Delivery_Time__c,asset.Delivery_cost_Incl__c '+
    'FROM  salesforce.Asset_Requisition_Form__c asset '+
     'INNER JOIN salesforce.Milestone1_Project__c proj '+
     'ON asset.Project_Department__c =  proj.sfid '+
      'WHERE asset.sfid = $1';

      console.log('qry '+qyr);
      let popupDetails = [];
      var objData =  {};
      await
       pool
       .query(qyr,[assetId])
       .then((assetQueryResult)=> {
           if(assetQueryResult.rowCount > 0)
           {
               console.log('assetQueryResult EDIT '+JSON.stringify(assetQueryResult.rows));
               //response.send(assetQueryResult.rows[0]);
               //popupDetails.push(assetQueryResult.rows[0]);
               //details.push(popupDetails);
               objData.asset = assetQueryResult.rows;
               console.log('hello i am inside Procurement Activity Code');
                 let projectId ;
               let activity ;
                               pool
                               .query('SELECT sfid, Project_Department__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1',[assetId])
                               .then((ProcurementQueryResult) => {
                                 console.log('ProcurementQueryResult :' +JSON.stringify(ProcurementQueryResult.rows));
                                 if(ProcurementQueryResult.rowCount > 0)
                                 {
                                    activity = ProcurementQueryResult.rows[0] ;
                                   projectId = activity.project_department__c;
                                   console.log('Inside Procurement query  : '+projectId);
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
                                       objData.activity = lstActivityCode;
                                     //  details.push(lstActivityCode);
                                       //response.send(objData);
                                     }
                                   })
                                   .catch((activityCodeQueryError) => {
                                     console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                                     response.send([]);
                                   })
                                 }
                               })
                               .catch((projectQueryError) =>
                                   {
                                 console.log('projectQueryError  : '+projectQueryError.stack);
                                  })

                        pool
                        .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[objUser.sfid])
                        .then(teamMemberResult => {
                            console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+' sfid :'+teamMemberResult.rows[0].sfid);
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
                                        objData.projectlist = projectQueryResult.rows;
                                        response.send(objData);
                                })
                                .catch((projectQueryError) => {
                                    console.log('projectQueryError  '+projectQueryError.stack);
                                    response.send({});

                                })
                                })   
                            .catch((projectTeamQueryError)=> {
                                console.log('projectTeamQueryError  '+projectTeamQueryError.stack);
                                response.send({});
                            })
                            })
                            .catch((teamMemberQueryError) => {
                            console.log('teamMemberQueryError  '+teamMemberQueryError.stack);
                            response.send({});
                            })

                            
           }
           else
           {
               response.send({});
           }
       })
       .catch((assetQueryError)=> {
           console.log('assetQueryError  : '+assetQueryError.stack);
           response.send({});
       })

});

router.get('/fetchActivityCode', verify ,(request, response) => {

    console.log('hello i am inside Procurement Activity Code');
  
    let assetId = request.query.assetId;
    console.log('assetId :' +assetId)
    let projectId ;
    let activity ;
                    pool
                    .query('SELECT sfid, Project_Department__c FROM salesforce.Asset_Requisition_Form__c WHERE  sfid = $1',[assetId])
                    .then((ProcurementQueryResult) => {
                      console.log('ProcurementQueryResult :' +JSON.stringify(ProcurementQueryResult.rows));
                      if(ProcurementQueryResult.rowCount > 0)
                      {
                         activity = ProcurementQueryResult.rows[0] ;
                        projectId = activity.project_department__c;
                        console.log('Inside Procurement query  : '+projectId);
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
                  })


                  router.get('/fetchActivityCodeforCreateNew', verify ,(request, response) => {

                    console.log('hello i am inside Procurement Activity Code');
                  
                                        pool
                                        .query('Select sfid , Name FROM salesforce.Activity_Code__c ')
                                        .then((activityCodeQueryResult) => {
                                          console.log('activityCodeQueryResult  : '+JSON.stringify(activityCodeQueryResult.rows));
                                          response.send(activityCodeQueryResult.rows);
                
                                        })
                                        .catch((activityCodeQueryError) => {
                                          console.log('activityCodeQueryError  : '+activityCodeQueryError.stack);
                                          response.send([]);
                                        })
                                      
                                    })
                                    
                

router.get('/details',verify, async(request, response) => {

    var assetId = request.query.assetId;
    console.log('assetId   '+assetId);

    var assetFormAndRelatedRecords = {};
    
 let qyr='SELECT asset.id, asset.sfid,asset.name as name ,act.name as actname, asset.GST__c,asset.Requested_Closure_Plan_Date__c,asset.Requested_Closure_Actual_Date__c,asset.Project_Department__c, '+
 'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,asset.Committee_Approved_Counts__c,'+
 'asset.Comittee_Rejected_Count__c,asset.Procurement_Committee_Status__c,asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,asset.Approval_Status__c,'+
 'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid, '+
 'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c, '+
 'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
  'asset.P_O_attachment__c,po_attachment_url__c,asset.advance_payment_status__c,asset.payment_status__c,asset.Status__c,asset.Payment_Received_Acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c, '+
  'asset.utr_number_transaction_details__c, asset.advance_payment_status__c, '+
  'asset.if_3_quotations_specify_Reason__c,asset.reason_for_non_registered_GST_Vendor__c, asset.Pricing_Terms_Cost_comparison__c, asset.Delivery_Terms_Delivery_Place__c, asset.Delivery_Terms_Delivery_Time__c,asset.Delivery_cost_Incl__c '+
 'FROM  salesforce.Asset_Requisition_Form__c asset '+
  'INNER JOIN salesforce.Milestone1_Project__c proj '+
  'ON asset.Project_Department__c =  proj.sfid '+
  'INNER JOIN salesforce.Activity_Code__c act ON asset.Activity_Code_Project__c = act.sfid '+
   'WHERE asset.sfid = $1';
   console.log('qry '+qyr);
    await
    pool
    .query(qyr,[assetId])
    .then((assetQueryResult)=> {
        if(assetQueryResult.rowCount > 0)
        {
            console.log('assetQueryResult  '+JSON.stringify(assetQueryResult.rows));
            assetFormAndRelatedRecords.assetFormDetails = assetQueryResult.rows;        
        }
        else
        {
            console.log('from activity code error'+JSON.stringify(assetQueryResult));
            assetFormAndRelatedRecords.assetFormDetails = [];
        }
    })
    .catch((assetQueryError)=> {
        console.log('assetQueryError  : '+assetQueryError.stack);
        assetFormAndRelatedRecords.assetFormDetails = [];
    })

    await
    pool
    .query('SELECT sfid, Name,Products_Services_Name__c, Items__c,Quantity__c, Others__c, Budget__c FROM  salesforce.Product_Line_Item__c WHERE Asset_Requisition_Form__c = $1',[assetId])
    .then((NonItProductResult)=> {
            if(NonItProductResult.rowCount > 0)
            {   
                    console.log('NonItProductResult  '+NonItProductResult.rows);
                    assetFormAndRelatedRecords.nonItProducts = NonItProductResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.nonItProducts = [];
            }

    })
    .catch((NonItProductError)=> {
        console.log('NonItProductError  '+NonItProductError.stack);
        assetFormAndRelatedRecords.nonItProducts = [];
    })

    await
    pool
    .query('SELECT sfid, Name, Items__c, Quantity__c, Budget__c FROM salesforce.Product_Line_Item_IT__c WHERE Asset_Requisition_Form__c = $1 ',[assetId])
    .then((ItProductResult) => {
            if(ItProductResult.rowCount > 0)
            {
                console.log('ItProductResult  '+ItProductResult.rows);
                assetFormAndRelatedRecords.itProducts = ItProductResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.itProducts = [];
            }
     })
    .catch((ItProductError) => {
        console.log('ItProductError   '+ItProductError.stack);
        assetFormAndRelatedRecords.itProducts = [];
    })


    await
    pool
    .query('SELECT sfid, Name, Approval_Type__c, Status__c, Approver_s_Emails__c FROM salesforce.Approval__c WHERE Asset_Requisition_Form__c = $1 ',[assetId])
    .then((approvalQueryResult) => {
            if(approvalQueryResult.rowCount > 0)
            {
                console.log('approvalQueryResult  '+approvalQueryResult.rows);
                assetFormAndRelatedRecords.approvals = approvalQueryResult.rows;
            }
            else
            {
                assetFormAndRelatedRecords.approvals = [];
            }
     })
    .catch((approvalQueryError) => {
        console.log('approvalQueryError   '+approvalQueryError.stack);
        assetFormAndRelatedRecords.approvals = [];
    })


    response.send(assetFormAndRelatedRecords);

});

router.post('/insertAsssetForm',(request,response)=>{
    let body = request.body;
    let planDate=request.body.planDate;
    let actualDate=request.body.actualDate;
    console.log('Form Value =>'+JSON.stringify(body));
   const{assetRequisitionName,projectName,submittedBy,act}=request.body;
   console.log('Asset name=> '+assetRequisitionName);
   console.log('Asset projectName=> '+projectName);
   console.log('Asset actualDate=> '+actualDate);
   console.log('Asset planDate=> '+planDate);
   console.log('Asset spocApproval=> '+submittedBy);
   console.log('Activity code '+act);
  // console.log('Asset spocApproval=> '+spocApproval);
  // console.log('availableInStock=> '+availableInStock);
   if(planDate==''){
       console.log('dsjjd');
       planDate=null;      
   }
   if(actualDate==''){
    console.log('dsjjd'+actualDate+'aa');
    actualDate=null;      
}
console.log(planDate+'  +'+actualDate);
const schema=joi.object({
    assetRequisitionName:joi.string().required().label('Please Fill Asset Requition Name'),
    projectName:joi.string().required().label('Please choose Project/Department'),
})
let result=schema.validate({assetRequisitionName,projectName});
if(result.error){
    console.log('fd'+result.error);
    response.send(result.error.details[0].context.label);    
}
else{
   let query ='INSERT INTO salesforce.Asset_Requisition_Form__c (name,Project_Department__c,Requested_Closure_Actual_Date__c,Requested_Closure_Plan_Date__c,Activity_Code_project__c,Submitted_By_Heroku_User__c) values ($1,$2,$3,$4,$5,$6)';
   console.log('asset Insert Query= '+query);
   pool
   .query(query,[assetRequisitionName,projectName,actualDate,planDate,act,submittedBy])
   .then((assetQueryResult) => {     
            console.log('assetQueryResult.rows '+JSON.stringify(assetQueryResult));
            response.send('Successfully Inserted');
   })
   .catch((assetInserError) => {
        console.log('assetInserError   '+assetInserError.stack);
        response.send('Error');
   })
}
})

router.post('/updateasset',(request,response)=>{
    let body = request.body;
    let closureActualDate=request.body.closureActualDate;
    let closurePlanDate =request.body.closurePlanDate;
    let goodsDate=request.body.goodsDate;
    console.log('body  : '+JSON.stringify(body));
    const {assetsfid, assetName,activityCode,paymentStatus,status,payement,receiverName,receivedQuantity,quotations,reason,pricing,deliveryPlace,deliveryTime,deliveryCost,attachment} = request.body;
    console.log('assetsfid    '+assetsfid);
    console.log('closureActualDate  '+closureActualDate);
    console.log('closurePlanDate  '+closurePlanDate);
    console.log('activityCode  '+activityCode);
    console.log('paymentStatus  '+paymentStatus);
    console.log('status  '+status);
    console.log('payement  '+payement);
    console.log('receiverName  '+receiverName);
    console.log('receivedQuantity  '+receivedQuantity);
    console.log('goodsDate  '+goodsDate);
    console.log('assetName  '+assetName);
    console.log('quotations  '+quotations);
    console.log('reason  '+reason);
    console.log('pricing  '+pricing);
    console.log('deliveryPlace  '+deliveryPlace);
    console.log('deliveryTime  '+deliveryTime);
    console.log('deliveryCost  '+deliveryCost);
    console.log('attachment  '+attachment);
    

    if(closurePlanDate==''){
        console.log('plan');
        closurePlanDate='1970-01-02';
    }
    if(closureActualDate==''){
        console.log('dsclosure'+closureActualDate+'aa');
        closureActualDate='1970-01-02'; 
    }
    if(goodsDate==''){
        console.log('dsjjd goods ');
        goodsDate='1970-01-02';
    }

    console.log('goodsDate'+goodsDate);
    let updateQuerry = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+
    'Name = \''+assetName+'\', '+
    'Requested_Closure_Actual_Date__c = \''+closureActualDate+'\', '+
    'Requested_Closure_Plan_Date__c = \''+closurePlanDate+'\', '+
    'Activity_Code_Project__c = \''+activityCode+'\', '+
    'p_o_attachment__c = \''+attachment+'\', '+
   // 'Payment_Status__c = \''+paymentStatus+'\', '+
    'Status__c = \''+status+'\', '+
    'Payment_Received_Acknowledgement__c = \''+payement+'\', '+
    'Receiver_Name__c = \''+receiverName+'\', '+
    'if_3_quotations_specify_reason__c= \''+quotations+'\', '+
    'reason_for_non_registered_gst_Vendor__c= \''+reason+'\', '+
    'pricing_terms_cost_comparison__c= \''+pricing+'\', '+
    'delivery_terms_delivery_place__c= \''+deliveryPlace+'\', '+
    'delivery_terms_delivery_time__c= \''+deliveryTime+'\', '+
    'delivery_cost_incl__c= \''+deliveryCost+'\', '+
    'Received_Quantity_Goods__c= \''+receivedQuantity+'\', '+
    'Date_of_Receiving_Goods__c= \''+goodsDate+'\' '+
    'WHERE sfid = $1';
    console.log('updateQuerry '+updateQuerry);

    var payPass='';
    var attchPass='';
    if(paymentStatus=='Released'){
        if(status=='Closed'){
            payPass='true';
            console.log('status :'+status+' paymetStatus :'+paymentStatus+' payPass:'+payPass);
        }   
    }
    else{
        if(status!='Closed'){
            payPass='false';
        }
    }
    if(attachment!=null && attachment!=''){
        console.log('reason '+reason+' quotations:'+quotations+' pricing:'+pricing+' deliveryPlace:'+deliveryPlace+' deliveryTime:'+deliveryTime+' deliveryCost:'+deliveryCost);
        if(reason=='true' && quotations =='true' && pricing=='true'  && deliveryPlace!='' && deliveryTime!='' && deliveryCost!='' ){
            attchPass='true';
            console.log('attchPass '+attchPass);
        }
    }

    if(attachment==null || attachment=='' ){  
        if(payPass=='true' || payPass=='false'){
        console.log('******');
        pool.query(updateQuerry,[assetsfid])
        .then((queryResultUpdate)=>{
         console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
         response.send('succesfully Update!');
        }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})
     }
     else{
         response.send('Choose Status Closed only When payment is Released ')
     }
    
    }
    else{
        console.log('@@@@@');
        if(attchPass=='true'){
            if(payPass=='true' || payPass=='false'){
                console.log('@@@@@1111');
                pool.query(updateQuerry,[assetsfid])
                .then((queryResultUpdate)=>{
                console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
                response.send('succesfully Update!');
                }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})   
            }
            else{
                response.send('Choose Status Closed only When payment is Released !!!')

            }
           
        }  
        else{
            response.send('Please fill all field in Purchase Order Checklist');
        }        
    }


})



   
    
    /* 
    else if(paymentStatus=='Rejected'){
        if(status=='' && payement=='' && receiverName=='' && receivedQuantity==''){
            console.log('VAlidation passed for REJECTED payments');
            let updateQuerry = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+
    'Name = \''+assetName+'\', '+
    'Requested_Closure_Actual_Date__c = \''+closureActualDate+'\', '+
    'Requested_Closure_Plan_Date__c = \''+closurePlanDate+'\', '+
    'Activity_Code_Project__c = \''+activityCode+'\', '+
    'p_o_attachment__c = \''+attachment+'\', '+
  //  'Payment_Status__c = \''+paymentStatus+'\', '+
    'Status__c = \''+status+'\', '+
    'Payment_Received_Acknowledgement__c = \''+payement+'\', '+
    'Receiver_Name__c = \''+receiverName+'\', '+
    'Received_Quantity_Goods__c= \''+receivedQuantity+'\', '+
    'if_3_quotations_specify_reason__c= \''+quotations+'\', '+
    'reason_for_non_registered_gst_Vendor__c= \''+reason+'\', '+
    'pricing_terms_cost_comparison__c= \''+pricing+'\', '+
    'delivery_terms_delivery_place__c= \''+deliveryPlace+'\', '+
    'delivery_terms_delivery_time__c= \''+deliveryTime+'\', '+
    'delivery_cost_incl__c= \''+deliveryCost+'\', '+
    'Date_of_Receiving_Goods__c= \''+goodsDate+'\' '+
    'WHERE sfid = $1';
    console.log('updateQuerry '+updateQuerry);
   pool.query(updateQuerry,[assetid])
   .then((queryResultUpdate)=>{
       console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
       response.send('succesfully inserted');
   }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})
        }
        else{response.send('LEAVE raiser fields blank')}
 
    }
    else {
        response.send('Updates error ');
    }
    */
    




router.post('/nonItProducts', (request,response) => {

   let nonItFormResult = request.body;

   console.log('nonItFormResult  '+JSON.stringify(nonItFormResult));
  /*  let img1=request.body.imgpath1;
   console.log('=>>'+img1);
   let img2=request.body.imgpath2;
   console.log('=>>'+img2);
   let img3=request.body.imgpath3;
   console.log('=>>'+img3);
   let justify=request.body.justification;
   console.log('justified'+justify); */

   const{state,district,unit,unitCost,itemsCategory,items,itemSpecification,quantity,budget}=request.body;
   let numberOfRows,lstNonItProcurement = [];
   if(typeof(nonItFormResult.quantity) != 'object')
   {

        let schema=joi.object({
            state:joi.string().required().label('Please Choose State'),
             itemsCategory:joi.string().required().label('Choose itemsCategory & District If Your Choose UP Or UK'),
             items:joi.string().required().label('Choose your Item'),
            itemSpecification:joi.string().required().label('Fill your Item Specification'),          
            quantity:joi.number().required().label('Enter your Quantity'),
            budget:joi.number().required().label('fill Your Budget '),
        })
        let result=schema.validate({state,items,itemsCategory,itemSpecification,quantity,budget});
        console.log('validation hsh '+JSON.stringify(result.error));
        if(result.error){
            console.log('fd'+result.error);
            response.send(result.error.details[0].context.label);
        }
        else{
            if(nonItFormResult.quoteNum<3 && (nonItFormResult.justification==null || nonItFormResult.justification=="")){
                    response.send('Please Enter Your Justification for Quote less than 3');    
           }
           else{
            let singleRecordValues = [];
            singleRecordValues.push(nonItFormResult.itemsCategory);
            singleRecordValues.push(nonItFormResult.items);
            singleRecordValues.push(nonItFormResult.state);
            singleRecordValues.push(nonItFormResult.district);
            singleRecordValues.push(nonItFormResult.unitCost);
            singleRecordValues.push(nonItFormResult.unit);
          //  singleRecordValues.push(nonItFormResult.otherItems);
            singleRecordValues.push(nonItFormResult.itemSpecification);
            singleRecordValues.push(nonItFormResult.quantity);
            singleRecordValues.push(nonItFormResult.budget);
            singleRecordValues.push(nonItFormResult.imgpath1);
            singleRecordValues.push(nonItFormResult.imgpath2);
            singleRecordValues.push(nonItFormResult.imgpath3);
            singleRecordValues.push(nonItFormResult.quoteNum    );
            singleRecordValues.push(nonItFormResult.justification);
            singleRecordValues.push(nonItFormResult.vendor);
            singleRecordValues.push(nonItFormResult.parentProcurementId);
            lstNonItProcurement.push(singleRecordValues);
            console.log('lstNOnIt'+lstNonItProcurement);
           }
      

        }      
   }
   else
   {
        numberOfRows = nonItFormResult.quantity.length;
        console.log('ROW COUnct'+numberOfRows);
        for(let i=0; i< numberOfRows ; i++)
        { 
            let schema=joi.object({
                state:joi.string().required().label('Please Choose State'),
                itemsCategory:joi.string().required().label('Choose itemsCategory & District If Your Choose UP Or UK'),
                items:joi.string().required().label('Choose your Item'),
                itemSpecification:joi.string().required().label('Fill your ITem Specification'),          
                quantity:joi.number().required().label('Enter your Quantity'),
                budget:joi.number().required().label('fill Your Budget '),
    
            })
            let result=schema.validate({state:state[i],items:items[i],itemsCategory:itemsCategory[i],itemSpecification:itemSpecification[i],quantity:quantity[i],budget:budget[i]});
            console.log('validation REsult mul'+JSON.stringify(result.error));
            if(result.error){
                console.log('Validation error'+result.error);
                response.send(result.error.details[0].context.label);
            }
            else{
                if(nonItFormResult.quoteNum[i]<3 &&(nonItFormResult.justification[i]==null || nonItFormResult.justification[i]=="")){               
                        response.send('Please Enter your Justification for Quote less than 3');    
                }
                else{

                    let singleRecordValues = [];
                    singleRecordValues.push(nonItFormResult.itemsCategory[i]);
                    singleRecordValues.push(nonItFormResult.items[i]);
                    singleRecordValues.push(nonItFormResult.state[i]);
                    singleRecordValues.push(nonItFormResult.district[i]);
                    singleRecordValues.push(nonItFormResult.unitCost[i]);
                    singleRecordValues.push(nonItFormResult.unit[i]);
                   // singleRecordValues.push(nonItFormResult.otherItems[i]);       
                    singleRecordValues.push(nonItFormResult.itemSpecification[i]);
                    singleRecordValues.push(nonItFormResult.quantity[i]);
                    singleRecordValues.push(nonItFormResult.budget[i]);
                    singleRecordValues.push(nonItFormResult.imgpath1[i]);
                    singleRecordValues.push(nonItFormResult.imgpath2[i]);
                    singleRecordValues.push(nonItFormResult.imgpath3[i]);
                    singleRecordValues.push(nonItFormResult.quoteNum[i]);
                    singleRecordValues.push(nonItFormResult.justification[i]);
                    singleRecordValues.push(nonItFormResult.vendor[i]);
                    singleRecordValues.push(nonItFormResult.parentProcurementId[i]);
                    lstNonItProcurement.push(singleRecordValues);
                    console.log('dj'+singleRecordValues);
                }
            }

       }
   }
   if(typeof(nonItFormResult.quantity) != 'object')
   {
    let nonItProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item__c (Products_Services_Name__c, Items__c,State__c,District__c,Per_Unit_Cost__c,unit__c, Product_Service__c, Quantity__c, Budget__c, Quote1__c,Quote2__c	,Quote3__c,Number_of_quotes__c,justification__c,Impaneled_Vendor__c, Asset_Requisition_Form__c ) VALUES %L returning id',lstNonItProcurement);
    console.log('nonItProductsInsertQuery '+nonItProductsInsertQuery);
    pool.query(nonItProductsInsertQuery)
    .then((nonItProductsInsertQueryResult) => {
         console.log('nonItProductsInsertQueryResult  '+JSON.stringify(nonItProductsInsertQueryResult.rows));
         response.send('Saved Successfully');
    })
    .catch((nonItProductsInsertQueryError) => {
         console.log('nonItProductsInsertQueryError  '+nonItProductsInsertQueryError.stack);
         response.send('Error Occured !');
    })
   }
   else{
    console.log('lstNonItProcurement:'+lstNonItProcurement.length+' number of rows :'+nonItFormResult.quantity.length);
   if(lstNonItProcurement.length==nonItFormResult.quantity.length){
    let nonItProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item__c (Products_Services_Name__c, Items__c, Product_Service__c, Quantity__c, Budget__c, Quote1__c,Quote2__c	,Quote3__c,Number_of_quotes__c,justification__c,Impaneled_Vendor__c, Asset_Requisition_Form__c ) VALUES %L returning id',lstNonItProcurement);
    console.log('nonItProductsInsertQuery '+nonItProductsInsertQuery);
    pool.query(nonItProductsInsertQuery)
    .then((nonItProductsInsertQueryResult) => {
         console.log('nonItProductsInsertQueryResult  '+JSON.stringify(nonItProductsInsertQueryResult.rows));
         response.send('Saved Successfully');
    })
    .catch((nonItProductsInsertQueryError) => {
         console.log('nonItProductsInsertQueryError  '+nonItProductsInsertQueryError.stack);
         response.send('Error Occured !');
    })
   }
}
});


router.get('/itProducts/:parentAssetId',verify, (request,response) => {

    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
  /*   let qry ='SELECT sfid ,	State__c,District__c,Items__c Form salesforce.Impaneled_Vendor__c';
    pool
    .query()
    .then((queryResult)=>{
        console.log('queryResult=>'+JSON.stringify(queryResult.rows));
        let state =[];
        queryResult.forEach((each)=>{
            state.push(each.state);
        })
        response.render('procurementIT',{name: request.user.name, email: request.user.email, parentAssetId: parentAssetId});
    }) */
    response.render('procurementIT',{name: request.user.name, email: request.user.email, parentAssetId: parentAssetId});

});
router.post('/itProducts', (request,response) => {

    console.log('Inside ItProducts Post Method');
    let itFormResult = request.body;
    const{state,items,district,unitCost,unit,itemSpecification,quantity,budget}=request.body;
    
    console.log('itFormResult  '+JSON.stringify(itFormResult));

    let numberOfRows, lstItProducts= [];
    if(typeof(itFormResult.quantity) != 'object')
    {
        const schema = joi.object({
            state:joi.string().required().label('Please chose State First'),
         //   district:joi.string().label('chose district') 
         items:joi.string().required().label('Choose your ITEM and District if State is UP or UK '),
         itemSpecification:joi.string().required().label('please Enter Item Specification'),
         quantity:joi.number().required().label('Enter Your Quanity '),
         budget:joi.number().required().label('Enter Your Budget'),
        })
        let result=schema.validate({state,items,itemSpecification,quantity,budget});
        console.log('validation REsult '+JSON.stringify(result.error));
        if(result.error){
            console.log('fd'+result.error);
            response.send(result.error.details[0].context.label);
        }
        else{
            if(itFormResult.quoteNum<3 &&(itFormResult.justification==null || itFormResult.justification=="")){
                    response.send('Please Enter Your Justification for Quote less than 3');     
             }
             else{
                let singleItProductRecordValue = [];
                singleItProductRecordValue.push(itFormResult.items);
                singleItProductRecordValue.push(itFormResult.vendor);
                singleItProductRecordValue.push(itFormResult.itemSpecification);
                singleItProductRecordValue.push(itFormResult.state);
                singleItProductRecordValue.push(itFormResult.district );
                singleItProductRecordValue.push(itFormResult.unitCost);
                singleItProductRecordValue.push(itFormResult.unit);
                singleItProductRecordValue.push(itFormResult.quantity);
                singleItProductRecordValue.push(itFormResult.budget);
                singleItProductRecordValue.push(itFormResult.imgpath1);
                singleItProductRecordValue.push(itFormResult.imgpath2);
                singleItProductRecordValue.push(itFormResult.imgpath3);
                singleItProductRecordValue.push(itFormResult.quoteNum);
                singleItProductRecordValue.push(itFormResult.justification);
                singleItProductRecordValue.push(itFormResult.parentProcurementId);
                lstItProducts.push(singleItProductRecordValue);
                console.log('else '+lstItProducts);
             }          
           
        }
    }
    else
    {
        numberOfRows = itFormResult.quantity.length;
        console.log('rowCount= '+numberOfRows);
        for(let i=0; i< numberOfRows ; i++)
        {
            const schema = joi.object({
                state:joi.string().required().label('Please chose State First'),
             //   district:joi.string().label('chose district') 
             items:joi.string().required().label('Choose your ITEM and District if State is UP or UK '),
             itemSpecification:joi.string().required().label('please Enter Item Specification'),
             quantity:joi.number().required().label('Enter Your Quanity '),
             budget:joi.number().required().label('Enter Your Budget'),
            })
            let result=schema.validate({state:state[i],items:items[i],itemSpecification:itemSpecification[i],quantity:quantity[i],budget:budget[i]});
            console.log('validation REsult '+JSON.stringify(result.error));
            if(result.error){
                console.log('fd'+result.error);
                response.send(result.error.details[0].context.label);
            }
            else{                
                if(itFormResult.quoteNum[i]<3 &&(itFormResult.justification[i]==null || itFormResult.justification[i]=="")){
                    response.send('Please Enter Your Justificaton for Quote less than 3 in row number');     
             }
             else{
                let singleItProductRecordValue = [];
                singleItProductRecordValue.push(itFormResult.items[i]);
                singleItProductRecordValue.push(itFormResult.vendor[i]);
                singleItProductRecordValue.push(itFormResult.itemSpecification[i]);
                singleItProductRecordValue.push(itFormResult.state[i]);
                singleItProductRecordValue.push(itFormResult.district[i]);
                singleItProductRecordValue.push(itFormResult.unitCost[i]);
                singleItProductRecordValue.push(itFormResult.unit[i]);
                singleItProductRecordValue.push(itFormResult.quantity[i]);
                singleItProductRecordValue.push(itFormResult.budget[i]);
                singleItProductRecordValue.push(itFormResult.imgpath1[i]);
                singleItProductRecordValue.push(itFormResult.imgpath2[i]);
                singleItProductRecordValue.push(itFormResult.imgpath3[i]);
                singleItProductRecordValue.push(itFormResult.quoteNum[i]);
                singleItProductRecordValue.push(itFormResult.justification[i]);
                singleItProductRecordValue.push(itFormResult.parentProcurementId[i]);
                lstItProducts.push(singleItProductRecordValue);
             }
            }
        }
        console.log('lstProduct '+lstItProducts);
    }

    console.log('lstItProducts  '+JSON.stringify(lstItProducts));
    if(typeof(itFormResult.quantity)!='object'){
        console.log('single row');
        const itProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item_IT__c (Items__c,Impaneled_Vendor__c,Product_Service_specification__c,State__c,District__c,Per_Unit_Cost__c,Unit__c, Quantity__c, Budget__c,Quote1__c,Quote2__c,Quote3__c,Number_of_quotes__c,justification__c ,Asset_Requisition_Form__c ) values %L returning id',lstItProducts);
        console.log(itProductsInsertQuery);
        pool.query(itProductsInsertQuery)
        .then((itProductsInsertQueryResult) => {
            console.log('itProductsInsertQueryResult  : '+JSON.stringify(itProductsInsertQueryResult.rows));
            response.send('Saved Successfully !');
        })
        .catch((itProductsInsertQueryError) => {
            console.log('itProductsInsertQueryError  : '+itProductsInsertQueryError.stack);
            response.send('Error Occurred !');
        })

    }
   if(lstItProducts.length==numberOfRows)
   {
    const itProductsInsertQuery = format('INSERT INTO salesforce.Product_Line_Item_IT__c (Items__c,Impaneled_Vendor__c,Product_Service_specification__c, Quantity__c, Budget__c,Quote1__c,Quote2__c,Quote3__c,Number_of_quotes__c,justification__c ,Asset_Requisition_Form__c ) values %L returning id',lstItProducts);
    console.log(itProductsInsertQuery);
    pool.query(itProductsInsertQuery)
    .then((itProductsInsertQueryResult) => {
        console.log('itProductsInsertQueryResult  : '+JSON.stringify(itProductsInsertQueryResult.rows));
        response.send('Saved Successfully !');
    })
    .catch((itProductsInsertQueryError) => {
        console.log('itProductsInsertQueryError  : '+itProductsInsertQueryError.stack);
        response.send('Error Occurred !');
    })
   }
    
});


router.get('/getRelatedQuote',(request, response) => {

    let filterValues = request.query.filtervalues;
    console.log('filtervalues  '+JSON.stringify(filterValues));
    console.log('filterValues.itemsCategoryValue '+filterValues.itemsCategoryValue);

    pool.query('SELECT sfid, Quote_Public_URL__c FROM salesforce.Impaneled_Vendor__c WHERE services__c = $1 AND items__c = $2 AND location_vendor__c = $3 ',[filterValues.itemsCategoryValue ,filterValues.itemValue,filterValues.placeValue])
    .then((QuoteQueryResult) => {
        console.log('QuoteQueryResult  '+JSON.stringify(QuoteQueryResult.rows));
        if(QuoteQueryResult.rowCount > 0)
        {
            response.send(QuoteQueryResult.rows[0]);
        }
        else
        {
            console.log('Else Block');
            response.send('Not Found');
        }
            
    })
    .catch((QuoteQueryError) => {
        console.log('QuoteQueryError  '+QuoteQueryError.stack);
        response.send('Not Found');
    })

});
router.get('/getCostandGSt',async(request,response)=>{
    let data=request.query.data;
    console.log('Data requiremet'+JSON.stringify(data));
    let st =data[0].state;
    let dstr=data[0].district;
    let ite=data[0].item;
    console.log('district'+dstr);
    console.log('item'+ite);
    console.log('state'+st);
    let qry='';
    let lst=[];
    let vender=[];
    let itemDesId=[];
    let qryItem='select sfid ,name,Impaneled_Vendor__c from salesforce.Item_Description__c WHERE Items__c =$1';  
     console.log('qryItem '+qryItem);
     await
     pool.query(qryItem,[ite])
     .then((result)=>{
         console.log('result '+JSON.stringify(result.rows));
         result.rows.forEach((each)=>{
            itemDesId.push(each);
         })
     })
     .catch((error)=>{
         console.log('Error  '+JSON.stringify(error.stack));
         response.send(error);
     })
     if(dstr=='' || dstr==null)
     {
         qry='SELECT sfid,vendor_name__c,GST_No__c,	Quote_Public_URL__c FROM salesforce.Impaneled_Vendor__c WHERE state__c = $1 ';
         lst.push(st);
         lst.push(ite);
         console.log('qryyy '+qry+'lstItem '+lst);
     }
     else{
         qry='SELECT sfid,vendor_name__c,GST_No__c,Quote_Public_URL__c FROM salesforce.Impaneled_Vendor__c WHERE state__c = $1 AND District__c = $2  ';
         lst=[st,dstr];
         console.log('qry '+qry+'lst '+lst);
     }
     console.log("items "+JSON.stringify(itemDesId));
     await
     pool
     .query(qry,lst)
     .then((querryResult)=>{
         console.log('querryResult '+JSON.stringify(querryResult.rows));
         if(querryResult.rowCount>0)
         {
            querryResult.rows.forEach((each)=>{
                   itemDesId.forEach((eachItem)=>{
                       if(each.sfid==eachItem.impaneled_vendor__c){
                        vender.push(each);
                       }
            })
           })  
           console.log
           response.send(vender);                   
         }       
     })
     .catch((querryError)=>{
         console.log('querryError '+querryError.stack);
         response.send(querryError);
     })
     
    
})

router.get('/getCostPerUnit',(request,response)=>{
    let sid=request.query.sid;
    console.log('seleceted ID =>'+sid);
    pool
    .query('SELECT sfid,Per_Unit_Cost__c,unit__c,items__c,Public_Quote_URL__c FROM salesforce.Item_Description__c where Impaneled_Vendor__c =$1',[sid])
    .then((querryResult)=>{
        console.log('queryResult  =>'+JSON.stringify(querryResult)+' '+ querryResult.rowCount);
        response.send(querryResult.rows);
    })
    .catch((querryError)=>{
        console.log(querryError.stack);
        response.send(querryError);
    })
})

router.get('/getProjectList',(request,response) => {

    console.log('Hello PRoject List');

    pool.query('SELECT sfid, name FROM salesforce.Milestone1_Project__c')
    .then((projectQueryResult)=> {
            console.log('projectQueryResult  '+JSON.stringify(projectQueryResult.rows));
            response.send(projectQueryResult.rows);
    })
    .catch((projectQueryError) => {
            console.log('projectQueryResult   '+projectQueryResult.stack);
            response.send([]);
    })

})

router.get('/getProcurementItListView/:parentAssetId',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
    response.render('procurementListView',{objUser,parentAssetId:parentAssetId});
})

router.get('/itProcurementList',(request,response)=>{
    let parentAssetId=request.query.parentId;
    console.log('parentAssetId '+parentAssetId);
    console.log('Your are inside the IT PRCUREMENT List Router method');
    let qry='SELECT procIT.sfid,procIT.Name as procItName ,procIT.Items__c,procIT.Number_of_quotes__c ,procIT.Product_Service_specification__c,vend.name as venderName,procIT.Quantity__c, procIT.Budget__c,procIT.Impaneled_Vendor__c '+
            'FROM salesforce.Product_Line_Item_IT__c procIT '+
            'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
            'ON procIT.Impaneled_Vendor__c =  vend.sfid '+
            'WHERE procIT.Asset_Requisition_Form__c=$1';
            console.log('qyer '+qry)
     pool
    .query(qry,[parentAssetId])
    .then((querryResult)=>{
        console.log('querryResult'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
        if(querryResult.rowCount>0){

            let modifiedProcurementITList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="procureItTag" id="'+eachRecord.sfid+'" >'+eachRecord.procitname+'</a>';
              obj.item = eachRecord.items__c;
              obj.item_spec = eachRecord.product_service_specification__c;
              obj.quantity = eachRecord.quantity__c;
              obj.budget = eachRecord.budget__c;
              obj.no = eachRecord.number_of_quotes__c;
              obj.vendor=eachRecord.vendername;
              obj.editAction = '<button href="#" class="btn btn-primary editProcIt" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedProcurementITList.push(obj);
            })
            response.send(modifiedProcurementITList);
        }
        else
        {
            response.send([]);
        }
    })
    .catch((querryError)=>{
        console.log('QuerrError=>'+querryError.stack);
        response.send(querryError); 
    })

})
router.get('/getProcurementITDetail',(request,response)=>{
      let procurementId=request.query.procurementId;
      var procDetail={};
        console.log('getProcurementITDetail Id='+procurementId);
        let qry='SELECT procIT.sfid,procIT.Name as procItName,procIT.Is_released_from_stock__c,procIT.Others__c,procIT.state__c,procIT.district__c,procIT.Justification__c,procIT.Number_of_quotes__c,procIT.Per_Unit_Cost__c,procIT.Unit__c,procIT.Quote1__c,procIT.Quote2__c,procIT.Quote3__c,procIT.Approvers__c ,procIT.Items__c ,procIT.Product_Service_specification__c,vend.name as venderName,procIT.Quantity__c, procIT.Budget__c,procIT.Impaneled_Vendor__c '+
        'FROM salesforce.Product_Line_Item_IT__c procIT '+
        'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
        'ON procIT.Impaneled_Vendor__c =  vend.sfid '+        
        'WHERE procIt.SFID=$1';
    console.log('Query '+qry);
    pool
    .query(qry,[procurementId])
    .then((querryResult)=>{
        console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
        procDetail.proc=querryResult.rows;
        pool.query('SELECT sfid,Name,Timely_submissions_of_Deliverables_Goods__c,Work_Quality_Goods_Quality__c,Quyantiut__c,Issue_Knowledge_Expertise__c,Procurement_IT__c FROM salesforce.Feedbacks_IT__c WHERE Procurement_IT__c=$1',[procurementId])
                .then((queryResult)=>{
                         console.log('queryResult'+JSON.stringify(queryResult));
                         procDetail.feedback=queryResult.rows;
                         console.log('procDetail list :'+JSON.stringify(procDetail));
                         response.send(procDetail);
                })
                .catch((error)=>{
                    console.log('erroror '+JSON.stringify(error.stack));
                })
    
    })
    .catch((querryError)=>{
        console.log('QuerrError '+querryError.stack);
        response.send(querryError);

    })
})
/**********************************  NON IT PROCUREMENT LIST VIEW   ******************************/
router.get('/getNonItProcurementListVIew/:parentAssetId',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let parentAssetId = request.params.parentAssetId;
    console.log('parentAssetId  '+parentAssetId);
    response.render('getNonItProcurementList',{objUser,parentAssetId: parentAssetId});
    
})

router.get('/NonItProcurementList',(request,response)=>{
    let parentAssetId=request.query.parentId;
    console.log('nonIT DETAIL LIST for parent id=  '+parentAssetId);
    let qry='SELECT proc.sfid,proc.Name as procName ,proc.Items__c ,proc.Products_Services_Name__c,vend.name as vendorName,proc.Product_Service__c,proc.Quantity__c, proc.Budget__c,proc.Impaneled_Vendor__c '+
    'FROM salesforce.Product_Line_Item__c proc '+
    'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
    'ON proc.Impaneled_Vendor__c =  vend.sfid '+
    'WHERE proc.Asset_Requisition_Form__c=$1';
    console.log('Queryy=> '+qry);
    pool
    .query(qry,[parentAssetId])
    .then((querryResult)=>{
        console.log('querryResultnonIt'+JSON.stringify(querryResult.rows)+'ROWCOUNT: '+querryResult.rowCount);
        if(querryResult.rowCount>0){

            let modifiedProcurementList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="procurementTag" id="'+eachRecord.sfid+'" >'+eachRecord.procname+'</a>';
              obj.item = eachRecord.items__c;
              obj.item_spec=eachRecord.product_service__c;
              obj.item_category = eachRecord.products_services_name__c;
              obj.quantity = eachRecord.quantity__c;
              obj.budget = eachRecord.budget__c;
              obj.vendor=eachRecord.vendorname;
              obj.editAction = '<button href="#" class="btn btn-primary editProcurement" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedProcurementList.push(obj);
            })
            response.send(modifiedProcurementList);
        }
        else
        {
            response.send([]);
        }
    })
    .catch((querryError)=>{
        console.log('QuerrError=>'+querryError.stack);
        response.send(querryError); 
    })


})
router.get('/getProcurementDetail',async(request,response)=>{
    let procurementId=request.query.procurementId;
    console.log('getProcurementITDetail Id='+procurementId);
    let procDetail={};
    let qry='SELECT proc.sfid,proc.Name as procName ,proc.Items__c ,proc.Others__c,proc.Approvers__c,proc.Products_Services_Name__c,vend.name as vendorName,proc.Product_Service__c,proc.Quantity__c, proc.Budget__c,proc.Impaneled_Vendor__c, '+
    'proc.State__c,proc.District__c,proc.Quote1__c,proc.Quote2__c,proc.Quote3__c,proc.Per_Unit_Cost__c,proc.unit__c,proc.Number_of_quotes__c,proc.justification__c '+
    'FROM salesforce.Product_Line_Item__c proc '+
    'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
    'ON proc.Impaneled_Vendor__c =  vend.sfid '+
    'WHERE proc.sfid=$1';
    pool
    .query(qry,[procurementId])
    .then((querryResult)=>{
    console.log('QuerryResult=>'+JSON.stringify(querryResult.rows));
   // response.send(querryResult.rows);
    procDetail.proc=querryResult.rows;
    console.log('oddskd '+JSON.stringify(procDetail));
    pool.query('SELECT sfid,Name,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,quantity_requested_vs_received__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE Procurement_Non_IT__c=$1',[procurementId])
                .then((queryResult)=>{
                         console.log('queryResult'+JSON.stringify(queryResult));
                         procDetail.feedback=queryResult.rows;
                         console.log('procDetail list :'+JSON.stringify(procDetail));
                         response.send(procDetail);
                })
                .catch((error)=>{
                    console.log('erroror '+JSON.stringify(error.stack));
                })
                .catch((querryError)=>{
                console.log('QuerrError '+querryError.stack);
                response.send(querryError);
                })
    })
})
router.post('/updateProcurement',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { specification, quantity,budget,hide} = request.body;
    console.log('specification of Item  '+specification);
    console.log('Procurement id  '+hide);
    console.log('budget  '+budget);
    let updateQuerry = 'UPDATE salesforce.Product_Line_Item__c SET '+
                         'product_service__c = \''+specification+'\', '+
                         'quantity__c = \''+quantity+'\', '+
                         'budget__c = \''+budget+'\' '+
                         'WHERE sfid = $1';
  console.log('updateQuerry  '+updateQuerry);
    pool
    .query(updateQuerry,[hide])
    .then((updateProcurementResult) => {     
             console.log('updateProcurementResult '+JSON.stringify(updateProcurementResult));
             response.send('Success');
    })
    .catch((updatetError) => {
         console.log('updatetError   '+updatetError.stack);
         response.send('Error');
    })
})

router.post('/updateProcurementIt',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { specification, quantity,budget,hide} = request.body;
    console.log('specification of Item  '+specification);
    console.log('Procurement id  '+hide);
    console.log('budget  '+budget);
    let updateQuerry = 'UPDATE salesforce.Product_Line_Item_IT__c SET '+
                         'product_service_specification__c = \''+specification+'\', '+
                         'quantity__c = \''+quantity+'\', '+
                         'budget__c = \''+budget+'\' '+
                         'WHERE sfid = $1';
  console.log('updateQuerry  '+updateQuerry);
    pool
    .query(updateQuerry,[hide])
    .then((updateProcurementITResult) => {     
             console.log('updateProcurementItResult =>>'+JSON.stringify(updateProcurementITResult));
             response.send('Success');
    })
    .catch((updatetError) => {
         console.log('updatetError'+updatetError.stack);
         response.send('Error');
    })
  })

router.get('/getVendorListView',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);  
    response.render('VendorlistView',{objUser});

})

router.get('/getVendorsList',(request,response)=>{
    let qry ='select sfid ,name,vendor_Name__c ,services__c,address__c,items__c,GST_No__c,Bank_IFSC_Code__c ,Bank_Account_No__c,State__c,District__c '+
     'FROM salesforce.Impaneled_Vendor__c ';
     console.log('qry  =>'+qry)
     pool.query(qry)
     .then((vendorQueryResult) => {
         console.log('vendorQueryResult  : '+JSON.stringify(vendorQueryResult.rows));
         if(vendorQueryResult.rowCount>0){

            let modifiedList = [],i =1;
            vendorQueryResult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.vendorname=eachRecord.vendor_name__c;
              obj.add=eachRecord.address__c;
              obj.state = eachRecord.state__c;
              obj.district=eachRecord.district__c;
              obj.editAction = '<button href="#" class="btn btn-primary editVendor" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedList.push(obj);
            })
            response.send(modifiedList);
        }
        else
        {
            response.send([]);
        }
     })
     .catch((error) => {
         console.log('error  : '+error.stack);
         response.send('Error Occurred !');
     })
})

router.get('/getVondor/:parentId',verify,(request,resposne)=>{
    let parentId=request.params.parentId;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+parentId);
    resposne.render('vendorDetailPage',{parentId,objUser});
})


router.get('/getVendorDetail',async(request,response)=>{
    let vendorId=request.query.vendorId;
    console.log('vendorId '+vendorId);
    
    let qry ='';
    console.log('qry Detail =>'+qry);
    let recordDeatil={};
    await
    pool
    .query('select sfid ,name,vendor_Name__c ,services__c,contact_no__c,name_of_signing_authority__c,bank_details__c,pan_no__c,address__c,items__c,GST_No__c,Bank_IFSC_Code__c ,Bank_Account_No__c,ownerid,Others__c,quote_public_url__c,State__c,District__c '+
    'FROM salesforce.Impaneled_Vendor__c where sfid=$1',[vendorId])
    .then((queryResult)=>{
        console.log('queryResult +>'+JSON.stringify(queryResult.rows));
        recordDeatil.VendorDetail=queryResult.rows;
        console.log('record '+recordDeatil);

        //response.send(queryResult.rows);
    })
    .catch((error)=>{
        console.log('error =>'+JSON.stringify(error.stack));
        response.send(error);
    })
await
pool
.query('select sfid ,name,Impaneled_Vendor__c,Unit__c,	Items__c,Per_Unit_Cost__c,Category__c '+
'FROM salesforce.Item_Description__c where impaneled_vendor__c=$1',[vendorId])
.then((itemdescriptionQueryy)=>{
    console.log('ten description =>'+JSON.stringify(itemdescriptionQueryy.rows));
    recordDeatil.item=itemdescriptionQueryy.rows;
})
.catch((error)=>{
    console.log('error '+error.stack);
    response.send(error);
})
console.log('reccord' +recordDeatil);
response.send(recordDeatil);
})
router.get('/createvendor',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    response.render('createImpaneledVendor',{objUser});
})
router.get('/ItemDescription/:parentVendor',verify,(request,response)=>{
    let parentVendor = request.params.parentVendor;
    console.log('parentVendor '+parentVendor);
    let objUser=request.user;
    console.log('user '+objUser);
    response.render('ItemDescriptionForm',{parentVendor,objUser});

})
router.post('/saveItemDescription',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{name,items,category,unit,cost,other,hide}=request.body;
    let record = [];
    //record.push(name);
    record.push(items);
    record.push(cost);
    record.push(category);
    record.push(unit);
    record.push(other);
    record.push(hide);
    let recordlist=[];
recordlist.push(record);
console.log(recordlist);

let itemDescQuery = format('INSERT INTO salesforce.Item_Description__c (Items__c,Per_Unit_Cost__c, Category__c,Unit__c,Other_Items__c,Impaneled_Vendor__c ) VALUES %L returning id',recordlist);
console.log('impaneledVendor=>'+itemDescQuery);
pool
.query(itemDescQuery)
.then((querryResult)=>{
    console.log('QuerryResult'+JSON.stringify(querryResult));
    response.send('Succesfully Inserted');
})
.catch((error)=>{
    console.log(error.stack);
    response.send(error);
})
})
  router.post('/saveVendor',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{name,authority, cont,bankkDet,ifsc,pan,gst,add,accNo,state,url,other,district}=request.body;
    console.log(name+authority+cont+bankkDet+ifsc+pan+gst+add+accNo+state+url+other+district);

    
    let record = [];
    record.push(name);
    record.push(authority);
    record.push(cont);
    record.push(bankkDet);
    record.push(ifsc);
    record.push(pan);
    record.push(gst);
    record.push(add);
    record.push(accNo);
    record.push(state);
    record.push(district);
    record.push(url);
    record.push(other);

let recordlist=[];
recordlist.push(record);
console.log(recordlist);

       let impaneledVendor = format('INSERT INTO salesforce.Impaneled_Vendor__c (Vendor_Name__c,Name_of_Signing_Authority__c,Contact_No__c,Bank_Details__c,Bank_IFSC_Code__c, PAN_No__c,GST_No__c,Address__c,Bank_Account_No__c,State__c,District__c, Quote_Public_URL__c,Others__c ) VALUES %L returning id',recordlist);
       console.log('impaneledVendor=>'+impaneledVendor);
    pool.query(impaneledVendor)
    .then((vendorQueryResult) => {
        console.log('vendorQueryResult  : '+JSON.stringify(vendorQueryResult.rows));
        response.send('Saved Successfully !');
    })
    .catch((error) => {
        console.log('error  : '+error.stack);
        response.send('Error Occurred !');
    })
  

    })
router.get('/ItemDescriptionListView',verify,(request,response)=>{
    let objUser=request.user;
    console.log('user '+objUser);
    let vendorId = request.query.vendorId;
    console.log('vendor Id =>'+vendorId);
    response.render('ItemDescriptionListView',{objUser,vendorId});

})

router.get('/getItemList',(request,response)=>{
    let id=request.query.id;
    console.log('Idd '+id);
    let qry='select item.sfid ,item.name as itemName,item.items__c, item.category__c,item.per_unit_cost__c,item.unit__c,item.other_items__c,vend.name as vendername,item.impaneled_vendor__c '+
                'FROM salesforce.Item_Description__c item '+
                'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
                'ON item.Impaneled_Vendor__c = vend.sfid '+
                'where item.impaneled_vendor__c=$1 AND item.sfid IS NOT null';
   console.log('qyer '+qry)
    pool
    .query(qry, [id])
    .then((querryResult)=>{
        console.log('QueryyResult '+JSON.stringify(querryResult.rows));
        if(querryResult.rowCount>0){

            let modifieldList = [],i =1;
            querryResult.rows.forEach((eachRecord) => {
                console.log('sfid '+eachRecord.sfid);
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="itemDetailTag" id="'+eachRecord.sfid+'" >'+eachRecord.itemname+'</a>';
              obj.category = eachRecord.category__c;
              obj.item = eachRecord.items__c;
              obj.unit = eachRecord.unit__c;
              obj.cost = eachRecord.per_unit_cost__c;
              obj.vendor=eachRecord.vendername;
              obj.editAction = '<button href="#" class="btn btn-primary editItem" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifieldList.push(obj);
            })
            response.send(modifieldList);
        }
        else
        response.send('[]');
    })
    .catch((error)=>{
        console.log('error '+error.stack);
        response.send(error);
    })
})

router.post('/sendProcurementApproval',(request, response) => {
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));

  /*  let updateProcurementQuery = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+  
    'isSentForApprovalFromHeroku__c = true , '+
    'Heroku_Approval_Comment__c = $1 '+
    'WHERE sfid = $2';
    pool
    .query(updateProcurementQuery,[body.comment, body.assetRequisitionFormId])
    .then((requisitionQueryResult) =>{
        console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
        response.send('Approval Sent Successfully !');
    })
    .catch((requisitionQueryError) =>{
        response.send('Error occured while sending approval !');
    })  */


    pool
    .query('UPDATE salesforce.Asset_Requisition_Form__c SET isSentForApprovalFromHeroku__c = $1 ,Heroku_Approval_Comment__c =$2 WHERE sfid= $3;',[true, body.comment, body.assetRequisitionFormId])
    .then((requisitionQueryResult) =>{
        console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
        response.send('Approval Sent Successfully !');
    })
    .catch((requisitionQueryError) =>{
        console.log('requisitionQueryError   '+requisitionQueryError);
        response.send('Error occured while sending approval !');
    })  
});

router.post('/sendProcurementAccountsApproval',(request, response) => {
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    let selectqry ='SELECT asset.id, asset.sfid as sfid,asset.name as name ,asset.Activity_Code__c, asset.GST__c,asset.Requested_Closure_Plan_Date__c,asset.Requested_Closure_Actual_Date__c,asset.Project_Department__c, '+
    'asset.Manager_Approval__c,asset.Management_Approval__c,asset.Procurement_Committee_Approval__c,asset.Chairperson_Approval__c,asset.Committee_Approved_Counts__c,'+
    'asset.Comittee_Rejected_Count__c,asset.Procurement_Committee_Status__c,asset.Accounts_Approval__c,asset.Procurement_Head_Approval__c,asset.Approval_Status__c,'+
    'asset.Number_Of_IT_Product__c,asset.Number_Of_Non_IT_Product__c,asset.Procurement_IT_total_amount__c,asset.Procurement_Non_IT_total_amount__c, asset.Total_amount__c,proj.name as projname,proj.sfid as profsfid, '+
    'asset.Management_Approval_Activity_Code__c,asset.Management_Approval_for_fortnight_limit__c, '+
    'asset.Management_Approval_less_than_3_quotes__c,asset.Procurement_Comt_Approval_for_fortnight__c, '+
     'asset.P_O_attachment__c,po_attachment_url__c,payment_status__c,asset.status__c,asset.payment_received_acknowledgement__c,asset.receiver_name__c,asset.received_quantity_goods__c,asset.date_of_receiving_goods__c '+
    'FROM  salesforce.Asset_Requisition_Form__c asset '+
     'INNER JOIN salesforce.Milestone1_Project__c proj '+
     'ON asset.Project_Department__c =  proj.sfid '+
      'WHERE asset.sfid = $1';
      console.log(selectqry);
      pool.query(selectqry,[body.assetRequisitionFormId])
      .then((result)=>{
          console.log('result '+JSON.stringify(result.rows));
          let eachRequisitionForm=result.rows[0];
          if((eachRequisitionForm.manager_approval__c == null) &&
              (eachRequisitionForm.procurement_head_approval__c == null) &&
              (eachRequisitionForm.procurement_committee_approval__c == null) &&
              (eachRequisitionForm.asset.procurement_comt_approval_for_fortnight__c == null)  &&
              (eachRequisitionForm.management_approval__c == null)  &&
              (eachRequisitionForm.chairperson_approval__c == null) &&
              (eachRequisitionForm.management_approval_less_than_3_quotes__c == null ) &&
              (eachRequisitionForm.management_approval_for_fortnight_limit__c == null) &&
              (eachRequisitionForm.management_approval_activity_code__c == null )
          ){
              console.log('all approval fields are null');
              response.send('Please send the record for approval first !');
          }
          else if((eachRequisitionForm.manager_approval__c == 'Pending') ||
          ( eachRequisitionForm.procurement_head_approval__c == 'Pending') ||
          ( eachRequisitionForm.procurement_committee_approval__c == 'Pending') ||
          ( eachRequisitionForm.asset.procurement_comt_approval_for_fortnight__c == 'Pending') ||
          ( eachRequisitionForm.management_approval__c == 'Pending') ||
          ( eachRequisitionForm.chairperson_approval__c == 'Pending') ||
          ( eachRequisitionForm.management_approval_less_than_3_quotes__c == 'Pending') ||
          ( eachRequisitionForm.management_approval_for_fortnight_limit__c == 'Pending') ||
          (  eachRequisitionForm.management_approval_activity_code__c == 'Pending')
          )
          {
              console.log('one of the fields are is pending state');
              response.send('You cannot send for accounts approval until there is a pending status !');
          }
          else{
              console.log('READY FOR SEND Accout APPROVAL');
              pool
              .query('UPDATE salesforce.Asset_Requisition_Form__c SET isSentForApprovalFromHeroku__c = $1 ,Heroku_Accounts_Approval_Comment__c =$2 WHERE sfid= $3;',[true, body.comment, body.assetRequisitionFormId])
              .then((requisitionQueryResult) =>{
                  console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
                  response.send('Accounts Approval Sent Successfully !');
              })
              .catch((error)=>{
                  console.log('error '+JSON.stringify(error.stack));
                  response.send(error);
            })
          }
      })

  /*  pool
    .query('UPDATE salesforce.Asset_Requisition_Form__c SET isSentForApprovalFromHeroku__c = $1 ,Heroku_Approval_Comment__c =$2 WHERE sfid= $3;',[true, body.comment, body.assetRequisitionFormId])
    .then((requisitionQueryResult) =>{
        console.log('requisitionQueryResult  : '+JSON.stringify(requisitionQueryResult));
        response.send('Accounts Approval Sent Successfully !');
    })
    */
    .catch((requisitionQueryError) =>{
        console.log('requisitionQueryError   '+requisitionQueryError);
        response.send('Error occured while sending approval !');
    }) 

    
});




router.post('/updateVendor',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name, state,district,aacc,auth,cont,bankDetail,ifsc,pan,add,gst,other,quote,hide} = request.body;
    console.log('state state state  '+state);
    console.log('Vendor id  '+hide);
    console.log('name  '+name);
    console.log('district  '+district);
    console.log('aacc  '+aacc);
    console.log('auth  '+auth);
    console.log('cont  '+cont);
    console.log('bankDetail  '+bankDetail);
    console.log('ifsc  '+ifsc);
    console.log('pan  '+pan);
    console.log('add  '+add);
    console.log('gst  '+gst);
    console.log('other'  +other);
    console.log('quote  '+quote);
    let updateQuerry = 'UPDATE salesforce.Impaneled_Vendor__c SET '+
                         'vendor_Name__c = \''+name+'\', '+
                         'District__c = \''+district+'\', '+
                         'State__c = \''+state+'\', '+
                         'Bank_Account_No__c = \''+aacc+'\', '+
                         'contact_no__c = \''+cont+'\', '+
                         'name_of_signing_authority__c = \''+auth+'\', '+
                         'name = \''+bankDetail+'\', '+
                         'Bank_IFSC_Code__c = \''+ifsc+'\', '+
                         'pan_no__c = \''+pan+'\', '+
                         'address__c = \''+add+'\', '+
                         'GST_No__c = \''+gst+'\', '+ 
                         'Others__c = \''+other+'\', '+ 
                         'quote_public_url__c = \''+quote+'\' '+                       
                         'WHERE sfid = $1';
  console.log('updateQuerry  '+updateQuerry);
    pool
    .query(updateQuerry,[hide])
    .then((updateQuerryResult) => {     
             console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
             response.send('Success');
    })
    .catch((updatetError) => {
         console.log('updatetError'+updatetError.stack);
         response.send('Error');
    })
})
router.get('/getItemDetail',(request,response)=>{
let itemId=request.query.itemId;
console.log('itemId '+itemId);
let qry='select item.sfid ,item.name as itemName,item.items__c, item.category__c,item.per_unit_cost__c,item.unit__c,item.other_items__c,vend.name as vendername,item.impaneled_vendor__c '+
                'FROM salesforce.Item_Description__c item '+
                'INNER JOIN salesforce.Impaneled_Vendor__c vend '+
                'ON item.Impaneled_Vendor__c = vend.sfid '+
                'where item.sfid=$1 ';
pool.query(qry,[itemId])
.then((itemdescriptionQueryy)=>{
console.log('Item description Detail=>'+JSON.stringify(itemdescriptionQueryy.rows));
response.send(itemdescriptionQueryy.rows);
})
.catch((error)=>{
    console.log('error '+error.stack);
    response.send(error);
})
})
router.post('/updateItemescription',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { item, cate,cost,unit,other,quote,hide} = request.body;
    console.log('item    '+item);
    console.log('cost  '+cost);
    console.log('cate  '+cate);
    console.log('unit  '+unit);
    console.log('other  '+other);
    console.log('Item ID  '+hide);
    let updateQuerry = 'UPDATE salesforce.Item_Description__c SET '+
    'category__c = \''+cate+'\', '+
    'items__c = \''+item+'\', '+
    'unit__c = \''+unit+'\', '+
    'per_unit_cost__c = \''+cost+'\', '+
    'Other_Items__c= \''+other+'\' '+
    'WHERE sfid = $1';
console.log('updateQuerry  '+updateQuerry);
pool
.query(updateQuerry,[hide])
.then((updateQuerryResult) => {     
console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
response.send('Success');
})
.catch((updatetError) => {
console.log('updatetError'+updatetError.stack);
response.send('Error');
})


})

router.get('/createFeedback/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('createFeedbackform',{procid,objUser});

})
router.get('/createFeedbackIT/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('createFeedbackITform',{procid,objUser});
})

router.get('/getfeedback/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('getlistFeedback',{procid,objUser});

})
router.get('/getFeedbacklist',verify,(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quantity_requested_vs_received__c,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE Procurement_Non_IT__c=$1';
    console.log('qry  =>'+qry)
     pool.query(qry,[parentid])
     .then((feedbackqueryresult) => {
         console.log('feedbackqueryresult  : '+JSON.stringify(feedbackqueryresult.rows));
         if(feedbackqueryresult.rowCount>0){
            let modifiedList = [],i =1;
             feedbackqueryresult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.time=eachRecord.timely_submissions_of_all_deliverables__c;
              obj.quality=eachRecord.work_quality_goods_quality__c;
              obj.issue = eachRecord.issue_knowledge_expertise__c;
              obj.quant =eachRecord.quantity_requested_vs_received__c;
              obj.editAction = '<button href="#" class="btn btn-primary feededit" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedList.push(obj);
            })
            console.log('modifiedList '+JSON.stringify(modifiedList));
            response.send(modifiedList);
        }
        else
        {
            response.send([]);
        }
     })
     .catch((error) => {
         console.log('error  : '+error.stack);
         response.send('Error Occurred !');
     })
})

router.get('/getfeedbackIT/:procid',verify,(request,response)=>{
    let procid=request.params.procid;
    let objUser=request.user;
    console.log('obhUser =>'+objUser);
    console.log('parentId '+procid);
    response.render('getlistFeedbackIT',{procid,objUser});
})
router.get('/getfeedbackITlist',verify,(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,procurement_it__c FROM salesforce.Feedbacks_IT__c WHERE procurement_it__c=$1';
    console.log('qry  =>'+qry)
     pool.query(qry,[parentid])
     .then((feedbackqueryresult) => {
         console.log('feedbackqueryresult IT : '+JSON.stringify(feedbackqueryresult.rows));
         if(feedbackqueryresult.rowCount>0){
            let modifiedList = [],i =1;
             feedbackqueryresult.rows.forEach((eachRecord) => {
              let obj = {};
              obj.sequence = i;
              obj.name = '<a href="#" class="vendorTag" id="'+eachRecord.sfid+'" >'+eachRecord.name+'</a>';
              obj.quantity=eachRecord.quyantiut__c
              obj.time=eachRecord.timely_submissions_of_deliverables_goods__c;
              obj.quality=eachRecord.work_quality_goods_quality__c;
              obj.issue = eachRecord.issue_knowledge_expertise__c;
              obj.editAction = '<button href="#" class="btn btn-primary editfeedIt" id="'+eachRecord.sfid+'" >Edit</button>'
              i= i+1;
              modifiedList.push(obj);
            })
            console.log('modifiedList '+JSON.stringify(modifiedList));
            response.send(modifiedList);
        }
        else
        {
            response.send([]);
        }
     })
     .catch((error) => {
         console.log('error  : '+error.stack);
         response.send('Error Occurred !');
     })

})
router.get('/getfeedbackdetail',(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,Timely_submissions_of_all_Deliverables__c,Work_Quality_Goods_Quality__c,Issue_Knowledge_Expertise__c,Procurement_Non_IT__c FROM salesforce.Feedback__c WHERE sfid=$1';
    console.log('qry  =>'+qry)
    pool.query(qry,[parentid])
    .then((result)=>{
        console.log(JSON.stringify(result.rows));
        response.send(result.rows);
    }).catch((eroor)=>{
        console.log(JSON.stringify(error.stack))
    })

})
router.get('/getfeedbackdetailIT',(request,response)=>{
    let parentid=request.query.parentId;
    console.log('parentid '+parentid);
    let qry = 'SELECT sfid,Name,quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,procurement_it__c FROM salesforce.Feedbacks_IT__c WHERE sfid=$1';
    console.log('qry  =>'+qry)
    pool.query(qry,[parentid])
    .then((result)=>{
        console.log(JSON.stringify(result.rows));
        response.send(result.rows);
    }).catch((eroor)=>{
        console.log(JSON.stringify(error.stack))
    })

})

router.post('/savefeedback',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality, issue,quantity,procid}=request.body;
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+procid);
    console.log('issue'+issue);
    console.log('quantity '+quantity);

    let feedCreateqry = 'INSERT INTO salesforce.Feedback__c (quantity_requested_vs_received__c,work_quality_goods_quality__c,timely_submissions_of_all_deliverables__c,procurement_non_it__c,issue_knowledge_expertise__c ) VALUES ($1,$2,$3,$4,$5)';
    console.log('feedCreateqry=>'+feedCreateqry);
    pool.query(feedCreateqry,[quantity,time,quality,procid,issue])
    .then((queryResult)=>{
        console.log('feedback INsert query result '+JSON.stringify(queryResult));
        response.send('succesfully inserted');
    })
    .catch((error)=>{
        console.log(error.stack);
        response.send(error);
    })
})

router.post('/updatefeedBack',(request,response)=>{

    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const { name, time,issue,quality,qua,feedid} = request.body;
    console.log('name    '+name);
    console.log('time  '+time);
    console.log('issue  '+issue);
    console.log('quality  '+quality);
    console.log('feedid  '+feedid);
    console.log('qua  '+qua);
    let updateQuerry = 'UPDATE salesforce.Feedback__c SET '+
    'Timely_submissions_of_all_Deliverables__c = \''+time+'\', '+
    'Issue_Knowledge_Expertise__c = \''+issue+'\', '+
    'quantity_requested_vs_received__c = \''+qua+'\', '+
    'Work_Quality_Goods_Quality__c= \''+quality+'\' '+
    'WHERE sfid = $1';
console.log('updateQuerry  '+updateQuerry);
pool
.query(updateQuerry,[feedid])
.then((updateQuerryResult) => {     
console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
response.send("succesfully Update");
})
.catch((updatetError) => {
console.log('updatetError'+updatetError.stack);
response.send('Error');
})

})

router.post('/savefeedbackIT',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality,name, issue,quantity,procid}=request.body;
    console.log('name '+name);
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+procid);
    console.log('issue'+issue);
    console.log('quantity '+quantity);
    let record=[];
    record.push(quantity);
    record.push(time);
    record.push(quality);
    record.push(issue);
    record.push(procid);
    let lstRecord =[];
    lstRecord.push(record);
    console.log('lst record '+lstRecord);
    let feedCreateqry = format('INSERT INTO salesforce.Feedbacks_IT__c (quyantiut__c,timely_submissions_of_deliverables_goods__c,work_quality_goods_quality__c,issue_knowledge_expertise__c,procurement_it__c ) VALUES %L returning id',lstRecord);;
    console.log('feedCreateqry=>'+feedCreateqry);
    pool.query(feedCreateqry)
    .then((queryResult)=>{
        console.log('feedback INsert query result '+JSON.stringify(queryResult));
        response.send('succesfully inserted');
    })
    .catch((error)=>{
        console.log(error.stack);
        response.send(error.stack);
    })

})
router.post('/updateITfeedback',(request,response)=>{
    let body = request.body;
    console.log('body  : '+JSON.stringify(body));
    const{time,quality,name, issue,quantity,feedid}=request.body;
    console.log('name '+name);
    console.log('time'+time);
    console.log('quality'+quality);
    console.log('procidt'+feedid);
    console.log('issue'+issue);
    console.log('quantity '+quantity);
    
    let updateQuerry = 'UPDATE salesforce.Feedbacks_IT__c SET '+
    'quyantiut__c = \''+quantity+'\', '+
    'timely_submissions_of_deliverables_goods__c = \''+time+'\', '+
    'issue_knowledge_expertise__c = \''+issue+'\', '+
    'work_quality_goods_quality__c= \''+quality+'\' '+
    'WHERE sfid = $1';
console.log('updateQuerry  '+updateQuerry);
pool
.query(updateQuerry,[feedid])
.then((updateQuerryResult) => {     
console.log('updateQuerryResult =>>'+JSON.stringify(updateQuerryResult));
response.send("succesfully Update");
})
    .catch((error)=>{
        console.log(error.stack);
        response.send(error.stack);
    })

})

router.get('/upload/:parentAssetId',verify,(request,response)=>{

    let parentAssetId = request.params.parentAssetId;
    let objUser=request.user;
    console.log('parentAssetId  '+parentAssetId);
    response.render('uploadFile',{parentAssetId,objUser});
})

router.post('/uploadFiless',(request,response)=>{
    let body=request.body;
    console.log('body '+JSON.stringify(body));
    const { imgpath,hide}=request.body;
    console.log('hide '+hide);
    console.log('imgpath '+imgpath);
   // var poattachment='Yes';

    let updateQuerry = 'UPDATE salesforce.Asset_Requisition_Form__c SET '+
    //'P_O_attachment__c = \''+poattachment+'\', '+
    'PO_Attachment_URL__c = \''+imgpath+'\' '+
    'WHERE sfid = $1';
    console.log('updateQuerry '+updateQuerry);
    if(imgpath!='demo'){
        pool.query(updateQuerry,[hide])
        .then((queryResultUpdate)=>{
            console.log('queryResultUpdate '+JSON.stringify(queryResultUpdate));
            response.send('succesfully inserted');
        }).catch((eroor)=>{console.log(JSON.stringify(eroor.stack))})

    }
    else{
        response.send('ERROR PLEASE CHOOSE FILE FILE');
    }
  
})
    
module.exports = router;