const {User , Bet , Deposit , Withdrawal} = require('../db');
const nodemailer = require("nodemailer");
const crypto = require('crypto');

// enter transaction id > return user details and deposit details > click submit > change the user details and then change parent details > return the details of updated user and parent ;

class user_functions {

  // league type 0 = virtual || league type 1 = league

  static place_bet = async (req , res)=>{

    const USER_ID = req.session.user_id;
    const INVITATION_CODE = req.session.inv;

    let date = Date.now();
    let bet_exist = await Bet.findOne(
      {
        inv : INVITATION_CODE,
        leagueId : req.body.league_id,
      }
    );

    let time_left = await check_date( req.body.date , req.body.time);

    if(time_left && !bet_exist || bet_exist == 'undefined'){

      let user_found = await User.findOne({inv : INVITATION_CODE});
      let user_balance = parseFloat(user_found['Ammount']);

      let data = {
        phone : user_found['phone'],
        inv : INVITATION_CODE,
        parent : user_found['parent'],
        bAmmount : parseFloat(req.body.ammount),
        leagueId : parseInt(req.body.league_id),
        league : req.body.league,
        team_a :  req.body.team_a,
        team_b : req.body.team_b,
        scoreDetails : [
          {
            first : req.body.first,
            second: req.body.second
          }
        ],
        final_score : [
          {
            first : -1,
            second : -1
          }
        ],
        date : req.body.date,
        time : req.body.time,
        profit : req.body.profit,
        league_type : req.body.l_type
      }

      let bet_amount = parseFloat(req.body.ammount);
      let deduct_amount = bet_amount - (bet_amount*2);


      if(user_balance >= data['bAmmount']){

        if(parseFloat(data['bAmmount']) >= 1000){

          if(await newBet(data)){

            await User.findOneAndUpdate( {_id : USER_ID} , {$inc : {betPlayed : 1 , Ammount : deduct_amount} });

            let body = `
            inv    : ${INVITATION_CODE} \n
            amount : ${bet_amount} \n
            leagueID : ${data['leagueId']}
            score  : ${data['scoreDetails'][0]['first']}-${data['scoreDetails'][0]['second']} \n
            `
            if(data['league'])
            SENDMAIL(data['league'] , body);

            return  res.send({'status' : 1});
          }else{
            return res.send({'status' : 0});
          }

        }else{
          return res.send({status : 5})
        }

      }else{
        return res.send({status : 4})
      }

    }else{

      if(bet_exist){
        return res.send({status : 2});
      }else if(!time_left){
        return res.send({status : 3});
      }else{
        return res.send({status : 0});
      }

    }

  }

  static sign_new_user = async (req , res)=>{

    res.clearCookie('id');

    let body = req.body;

    let inv = await generate_inv_code();

    let user_found = await User.findOne({user : body.name});
    let phone_found = await User.findOne({phone : body.contact});
    let avatar = Math.floor(Math.random()*10);
    avatar = (avatar === 0)? 1 : avatar;

    let data = {
      user : body.name,
      password : body.password,
      inv : inv,
      parent : body.invitation_code,
      phone : body.contact,
      avatar : avatar
    }

    let newUser = new User(data);

    if(body.invitation_code !== 0 && !user_found && !phone_found){

      let parent = await User.findOne({inv : body.invitation_code});

      if(parent){

        let is_created = await createUser(newUser);

        if(is_created){

          await increment_parent_mem(body.invitation_code);

          req.session.user_id = is_created['_id'].valueOf();
          req.session.inv = is_created['inv'];

          return res.send({status : 1});

        }else{
          return res.send({status : 0})
        }

      }else{
        return res.send({status : 0})
      }


    }else if(body.invitation_code == 0 && !user_found && !phone_found){

      let new_user_created = await createUser(newUser);

      if(new_user_created){

        req.session.user_id = new_user_created['_id'].valueOf();
        req.session.inv = new_user_created['inv'];
        return res.send({status : 1});

      }else{
        return res.send({status : 0});
      }

    }else{
      if(user_found){
        return res.send({status : 404});
      }else if(phone_found){
        return res.send({status : 101})
      }else{
        return res.send({status : 0})
      }
    }
  }

  static login_user = async (req , res)=>{

    let data = req.body;
    let db_user = await User.findOne({user : data.name});

    if(!data.pass || data.pass == 'undefined'){
      return res.send({status : 0});
    }

    if(
      db_user !== null &&
      db_user.password.localeCompare(data.pass) == 0
    ){

      req.session.user_id = db_user['_id'].valueOf();
      req.session.inv = db_user['inv'];
      return res.send({status : 1});

    }else{
      return res.send({status : 0});
    }

  }

  static spinner_update = async (req , res)=>{
    let today = new Date();
    let user = await User.findOne({_id : req.session.user_id});

    if(req.body.value){

      if(user['day_spinner'] !== today.getDate()){

        let amm = parseInt(req.body.value);
        await User.updateOne({_id : req.session.user_id} ,
          {
            $inc : {Ammount : amm},
            day_spinner : today.getDate()
          });
          return res.send({'status' : 1});
      }else{
        return res.send({status : 2});
      }
    }else{
      return res.redirect('/login');
    }

  }

  static delete_bet = async (req , res)=>{

     let INVITATION_CODE = req.session.inv;
     let id = parseInt(req.body.value);

     let bet = await Bet.findOne({leagueId : id , inv : INVITATION_CODE});

     if(bet){

       let valid_date = await check_date(bet['date'] , bet['time']);
       // console.log(valid_date);
       if(valid_date === true){
         let is_deleted  = await Bet.findOneAndDelete({leagueId : id , inv : INVITATION_CODE});
          // let is_deleted = false;
         if(is_deleted){

          let body = `
              INVITATION_CODE : ${INVITATION_CODE} \n
              BET AMOUNT      : ${bet.bAmmount} \n
              LEAGUE ID       : ${id} \n
              SCORE           : ${is_deleted['scoreDetails'][0]['first']}-${is_deleted['scoreDetails'][0]['second']} \n
             `
          SENDMAIL('BET DELETE' , body);

          await User.findOneAndUpdate({inv : INVITATION_CODE} , {$inc : {
            Ammount : parseFloat(bet.bAmmount),
            betPlayed : -1
             }
          })

          // return res.send({status : 1});
          return res.send({status : 1});

         }else{
          return res.send({status : 0});
         }

       }else{
         // if the time limit exeeded;
        return res.send({status : 2})
       }

     }else{
       res.send({status : 0})
     }



  }

  static deposited = async (req,res)=>{

    let {amount , transactioin_id} = req.body;

    let INVITATION_CODE = parseInt(req.session.inv);
    let trans_id_exist = await Deposit.findOne({transactioin_id : transactioin_id , inv : INVITATION_CODE});

    if(!trans_id_exist){
      if(amount && transactioin_id){

      amount = parseFloat(amount);
      let today = new Date();

      let date = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;


      let data = {
        date : date,
        Ammount : amount,
        inv : INVITATION_CODE,
        transactioin_id : transactioin_id,
        status : 0
      }

      if(await newDeposit(data)){

        let body = `
          DATE : ${date} \n
          INVITATION_CODE : ${data.inv} \n
          AMOUNT :  ${data.Ammount} \n
          TRANSACTION_ID : ${data.transactioin_id}
          `
        SENDMAIL('DEPOSIT' , body);

        res.send({status : 1});
      }else{
        res.send({status : 0});
      }

      }else{
      return res.send({status : 2}) // something went wrong with amount or the transaction id;
    }
    }else{
      return res.send({status : 3});
    }

  }

  static withdrawal = async (req,res)=>{

    let INVITATION_CODE = parseInt(req.session.inv);
    let USER_ID = req.session.user_id;
    let {withdrawal_code , amount} = req.body;
    let today = new Date();
    let transactioin_id = crypto.randomBytes(16).toString("hex");
    transactioin_id = transactioin_id.slice(0 , 6);

    let U_details = await User.findOne({inv : INVITATION_CODE} , {withdrawalC : 1 , day_withdrawal : 1 , BankDetails : 1 , betPlayed : 1 , Ammount : 1});

    let w_details = parseInt(U_details['withdrawalC']);
    let last_withdrawal = parseInt(U_details['day_withdrawal']);
    let bets_played = parseInt(U_details['betPlayed']);

    if(w_details == 0 || withdrawal_code !== w_details){
      return res.send({status : 'enter a VALID withdrawal code first'});//enter withdrawal code first
    }

    if( U_details['BankDetails'] == 'undefined' || !U_details['BankDetails'].length || !U_details['BankDetails'][0] || !U_details['BankDetails'][0]['Name']){
      return res.send({status : 'You dont have a bank account . '});
    }

    amount = parseFloat(amount);
    // check wethere user has the required balance or not
    if(amount > parseFloat(U_details['Ammount'])){
      return res.send({status : 'YOU DONT HAVE ENOUGH BALANCE'});
    }

    if(bets_played >= 6){
       if(last_withdrawal !== today.getDate() || last_withdrawal == 0){

      if(amount && transactioin_id && withdrawal_code){


      let date = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;


      let data = {
        date : date,
        Ammount : amount,
        inv : INVITATION_CODE,
        transactioin_id : transactioin_id,
        status : 0
      }

      if(await newWithdrawal(data)){

        let deduct_amount = parseFloat(data['Ammount'] - (2*data['Ammount']))
        // deduct the amount from the user and increment the withdrawal amount and withdrawal count;
        await User.findOneAndUpdate({_id : USER_ID} , {
          $inc : {Ammount : deduct_amount ,
                  withdrawalAmmount : parseFloat(data['Ammount']),
                  Withdrawals : 1
                 } ,
          day_withdrawal : today.getDate()
        });

        let body = `
          INVITATION_CODE  : ${INVITATION_CODE} \n
          BANK ACCOUNT NO. : ${U_details['BankDetails'][0]['AcNumber']} \n
          USER NAME        : ${U_details['BankDetails'][0]['Name']} \n
          IFSC             : ${U_details['BankDetails'][0]['Ifsc']} \n
          AMOUNT           : ${amount}\n
          AMOUNT - 10% : ${amount - parseFloat((amount/10).toFixed(3)) } \n
          TRANSACTION ID : ${data['transactioin_id']}
          DATE : ${date} \n
        `

        SENDMAIL('WITHDRAWAL' , body);

        res.send({status : 1});

      }else{
        res.send({status : 0});
      }

      }else{
      return res.send({status : 'something went wrong with amount.'}) // something went wrong with amount or the transaction id;
    }
       }else{
      return res.send({status : 'you have reached you daily withdrawal limit.'}); //transaction id already exists;
    }
    }else{
      return res.send({status : 'PLAY MINIMUM OF 6 BETS !! '});
    }

  }

  static add_bank_details = async (req, res)=>{

    let USER_ID = req.session.user_id;

    let the_user = await User.findOne({_id : USER_ID})

    if(the_user['bankDetailsAdded'] === false){

      let {name , ac_number , ifsc} = req.body;

      if(!name || !ac_number || !ifsc){
        return res.send({status : 3});
      }else{
        ac_number = ac_number
        let updated = await User.findOneAndUpdate( {_id : USER_ID} , {
          BankDetails : {
            Name : name,
            AcNumber : ac_number,
            Ifsc : ifsc
          } , bankDetailsAdded : true
        } );

        if(updated){
          return res.send({status : 1});
        }else{
          return res.send({status : 0})
        }
      }

    }else{

      return res.send({status : 2})//details already exist;

    }

  }

  static withdrawal_code = async (req,res)=>{
    let USER_ID =  req.session.user_id;
     let {previous_code , new_code} = req.body;

     if(previous_code == 'undefined' || !new_code){
       return res.send({status : 'try again with new withdrawal code'})//enter a valid data;
     }else{

        let user_data = await User.findOne({_id : USER_ID});

        if(previous_code == 0 && user_data['withdrawalC'] == 0){
          //update new code
          await User.findOneAndUpdate({_id : USER_ID} , {withdrawalC : parseInt(new_code)});
          return res.send({status : 1});

        }else if(previous_code == 0 && user_data['withdrawalC'] !== 0){
          // send you already have a code enter it first;
          return res.send({status : 'you already have a withdrawal code'});
        }else if(previous_code !== 0 && user_data['withdrawalC'] == 0){
          //you dont have data in db;
          return res.send({status : 'you dont have a stored withdrawal code'})//you dont have some data in db
        }else if(previous_code !== 0 && user_data['withdrawalC'] !== 0){
          // check validation
          if(parseInt(previous_code) == parseInt(user_data['withdrawalC'])){
              await User.findOneAndUpdate({_id : USER_ID} , {withdrawalC : parseInt(new_code)})
              res.send({status : 1});
          }else{
            return res.send({status : 'wrong previous code'})//wrong previous code
          }

        }else{
          return res.send({status : 'something went wrong'})//something went wrong
        }

     }
  }

  static change_password = async (req,res)=>{

     let USER_ID =  req.session.user_id;
     let {previous_code , new_code} = req.body;

     if(!previous_code || !new_code){
       return res.send({status : 3})//enter a valid data;
     }else{

        let user_data = await User.findOne({_id : USER_ID});

        if( previous_code === user_data['password']){
          await User.findOneAndUpdate({_id : USER_ID} , {password : new_code});
          return res.send({status : 1});
        }else{
          return res.send({status : "previous password not matched contact CS . "});
        }

     }
  }

  static usdt = async (req,res)=>{

    let {amount} = req.body;

    let INVITATION_CODE = parseInt(req.session.inv);
    if(amount){

      amount = parseFloat(amount);
      let today = new Date();

      let date = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;

      let body = `
      USDT DEPOSIT \n
      DATE : ${date} \n
      INVITATION_CODE : ${INVITATION_CODE} \n
      AMOUNT :  ${amount} \n
      `
      SENDMAIL('DEPOSIT' , body);
      return res.send({status : 1});
    }else{
      return res.send({status : 0})
    }
  }

}

module.exports = user_functions;

// this function saves the new bet user has placed;
async function newBet(data){

  let res = await Bet.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;

}

// this will create a new deposit form at the database;
async function newDeposit(data){

  let res = await Deposit.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

// when a user initiates a new withdrawal this will save teh data to the database
async function newWithdrawal(data){

  let res = await Withdrawal.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

// it will increment the member of the user who has invited this new user while sign_in;
async function increment_parent_mem(inv , prev_members){
  let x = await User.updateOne({inv : inv} , {$inc : {
    members : 1
  }})
  return;
}

 // it will check the date wethere its valid to place bet and match has not been started;
async function check_date(date , time ){


  const nDate = new Date().toLocaleString('en-US', {
  timeZone: 'Asia/Calcutta'
  });
  let today = new Date(nDate);

  let match_date = date.split(/\//);
  let m_time = time.split(/\:/);
  // console.log(m_time);
  let m_date = parseInt(match_date[0]);
  let m_month = parseInt(match_date[1]);
  let m_hours = parseInt(m_time[0]);
  let m_minutes = parseInt(m_time[1]);

  let minutes_now = parseInt(today.getMinutes());
  let hours_now = parseInt(today.getHours());

  // console.log(minutes_now , 'without');
  minutes_now += 5;
  if(minutes_now >= 60 ){
    minutes_now = minutes_now - 60;
    hours_now += 1;
  }

  let valid_date = (parseInt(today.getDate()) === m_date);
  let valid_hour = (hours_now < m_hours);
  let valid_minutes = ( minutes_now < m_minutes );
  let equal_hours = (hours_now === m_hours);
  // console.log(m_date , today.getDate(), m_hours , hours_now , minutes_now , m_minutes);
  // console.log(today);

  if(valid_date && valid_hour || valid_date && equal_hours && valid_minutes){
    return true;
  }

  return false;

}

// after signup it will create a new user at the database;
async function createUser(data){

  let res = await User.create(data);

  return res;

};

// this function will create the new invitation code for new users when signed in ;
async function generate_inv_code(){

  let code_exist = false;
  let inv_code = parseInt(Math.floor(Math.random()*10000));

  let res = await User.findOne({inv : inv_code});

  // if found then code_exist = true;

  code_exist = (res)? true : false;

  if(inv_code < 1000 || code_exist){
    return generate_inv_code();
  }

  return inv_code;

}

// mail sender
async function SENDMAIL(subject , body){

  let to = '';

  switch (subject) {

    case 'WITHDRAWAL':
      to = 'rockyraj0969@gmail.com';
      break;
    case 'DEPOSIT':
      to = 'jyotikumari63421@gmail.com';
      break;
    case 'BET DELETE':
      to = 'simrankumari6343@gmail.com';
      break;
    case 'VIRTUAL':
      to = 'manojkumar757320@gmail.com';
      break;
    default:
     to = 'amitram070651@gmail.com';
  }
   // console.log(to , subject);
  let transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
      user : 'vkv9162871357@gmail.com',
      pass : 'kahsizmojovvmsio'
    }
  })

  let mailOptions = {
    from : 'vkv9162871357@gmail.com',
    to : to,
    subject : subject,
    text : body
  }

  transporter.sendMail(mailOptions , async(err , info)=>{
    if(err){
      console.log(err);
    }
  })
}
