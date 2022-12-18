const {User , Bet , Deposit , Withdrawal} = require('../db');
const request = require('request');
// settle deposit > inv amount > find the user > send data > confirm data click continue;
// add teh settle withdrawal function in the app.js and create a section in settle.htmls
class admin_function{

  // league type = 0 = virtual
  // league type = 1 = league

  static settle_bet = async(req, res)=>{

    let id = req.body['id'];

    if(!id || id == 'undefined'){
      return res.send({err : '<h1>SORRY SOMETHING WENT WRONG WITH LEAGUE ID</h1>'});
    }else{


    let results = {970726 : {home : 1 , away : 3}};
    let settled = [];
    let bets = {};

    // add another querry parameter league id , cause if one user places two bets then he will get double rebade ammount; and this id you will get from user;

    let all_unsettled_bets = await Bet.find({settled : false , league_type : 1 , leagueId : id} , {bAmmount : 1 , leagueId : 1 , inv : 1 , scoreDetails : 1 , profit : 1 , date : 1 , members : 1 , ammount : 1 , final_score : 1 , rebade_amm : 1});

    if (all_unsettled_bets !== 'undefined' && all_unsettled_bets) {
      if(Object.keys(all_unsettled_bets).length == 0){
        return res.send({err : "id not found" })
      }
    }else{
      return res.send({err : 'something went wrong'});
    }

    if( all_unsettled_bets){

      let data = await get_settled_bet_byID(parseInt(all_unsettled_bets[0]['leagueId']));
      data = await JSON.parse(data);
      // console.log(await JSON.stringify(data));
      if(data && data['response'].length){

        let result_id = parseInt(data['response'][0]['fixture']['id']);
        let result_obj = data['response'][0]['goals'];
        // console.log(data['response'][0]['goals']);
        results[result_id] = result_obj;

      }else{
        return res.send(`<h1>Something went wrong try again. after checking the database or league id you entered !!!</h1>`);
      }

    }else{
      return res.send({err : 'Either their is no bet to settle or you have entered wrong league id'});
    }

    // setting things up
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0 ){

      for(let item of all_unsettled_bets){

        if( !(item['leagueId'] in results) ){
         return res.send({err : `<h1>ODD ONE OUT PLEASE ${item['leagueId']}</h1>`});
        }else{
          //this bets object will help me fin wethere a user has placed bet or not in O(1);
          bets[item['inv']] = item;

        }

      }

    }


    let test_array = [];
    // analyze all the data
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0){

      for(let level0 of all_unsettled_bets){

        let body = {
          inv : level0['inv'],
          leagueId : level0['leagueId'],
          amount : 0,
          profit : 0,
          rebade : 0,
          score_a : 0,
          score_b : 0,
        }

        let level1_rebade = 0 ;
        let level2_rebade = 0 ;
        let level3_rebade = 0 ;

        // console.log(level0);
        let score0 = results[level0['leagueId']];
        let test_amount = 0;
        let test_profit = 0;
        // console.log(results , level0['leagueId']);
        let score_a = parseInt(score0['home']);
        let score_b = parseInt(score0['away']);

        if(level0['scoreDetails'][0]['first'] !== score_a ||
        level0['scoreDetails'][0]['second'] !== score_b)
        {

          let profit0 = parseFloat(level0['profit']);
          let bet_ammount0 = parseFloat(level0['bAmmount']);

          body['amount'] = bet_ammount0 + (bet_ammount0/100 * profit0 - 1);

          body['profit'] = parseFloat(parseFloat(bet_ammount0/100 * profit0 - 1).toFixed(3));

        }

        body['score_a'] = score_a;
        body['score_b'] = score_b;

        // find level 1 users

        let level1_user = await User.find({parent : parseInt(level0['inv']) });

        if(level1_user){

          for(let level1 of level1_user){

            if(level1['inv'] in bets){

              if(bets[level1['inv']]['scoreDetails'][0]['first'] !== score_a ||
              bets[level1['inv']]['scoreDetails'][0]['second'] !== score_b)
              {

                let profit1 = parseFloat((bets[level1['inv']]['profit']).toFixed(3));
                let bet_ammount1 = parseFloat(parseFloat(bets[level1['inv']]['bAmmount']).toFixed(3));

                level1_rebade += parseFloat( (bet_ammount1/100 * profit1).toFixed(3) );

              }

            }

            let level2_user = await User.find({parent : parseInt(level1['inv'])});

            if(level2_user){

              for(let level2 of level2_user){

                if(level2['inv'] in bets){


                  if(bets[level2['inv']]['scoreDetails'][0]['first'] !== score_a ||
                  bets[level2['inv']]['scoreDetails'][0]['second'] !== score_b)
                  {

                    let profit2 = parseFloat(bets[level2['inv']]['profit']);
                    let bet_ammount2 = parseFloat(bets[level2['inv']]['bAmmount']);

                    level2_rebade += (bet_ammount2/100) * profit2;

                  }


                }

                let level3_user = await User.find({parent : level2['inv']});

                if(level3_user){

                  for(let level3 of level3_user){

                    if(level3['inv'] in bets){

                      if(bets[level3['inv']]['scoreDetails'][0]['first'] !== score_a ||
                      bets[level3['inv']]['scoreDetails'][0]['second'] !== score_b)
                      {

                        let profit3 = parseFloat(bets[level3['inv']]['profit']);
                        let bet_ammount3 = parseFloat(bets[level3['inv']]['bAmmount']);


                        level3_rebade += parseFloat(((bet_ammount3/100) * profit3).toFixed(3));

                      }

                    }

                  }

                }

              }

            }

          }

        }


        let final_rebade1 = parseFloat( ((parseFloat(level1_rebade)/100 ) * 12).toFixed(3) );
        let final_rebade2 = parseFloat( ((parseFloat(level2_rebade)/100 ) * 10).toFixed(3) );
        let final_rebade3 = parseFloat( ((parseFloat(level3_rebade)/100 ) * 8).toFixed(3) );

        body['rebade'] = parseFloat( (final_rebade1 + final_rebade2 + final_rebade3).toFixed(3) );

        test_array.push(body);
      }

    }


    let new_data = [];

    if(test_array){

      for(let update_it of test_array){

        let set_score_a = parseInt(update_it['score_a']);
        let set_score_b = parseInt(update_it['score_b']);
        let to_update_amm = parseFloat( (update_it['amount'] + update_it['rebade']).toFixed(3) );

        let updated_data = await User.findOneAndUpdate(
          {inv : update_it['inv']} ,
          {
            $inc : {
              Ammount : to_update_amm,
              RebadeBonus : parseFloat(parseFloat(update_it['rebade']).toFixed(3)),
              profit : parseFloat(parseFloat(update_it['profit']).toFixed(3))
            },
          }
        );

        let updated_bet = await Bet.findOneAndUpdate(
          {inv : update_it['inv'] , leagueId : update_it['leagueId']} ,
          {
            settled : true,
            final_score : [{first : set_score_a , second : set_score_b}]
          },{new : true}
        );

        new_data.push(updated_data);

      }
    }

    return res.send({'settled_bets' : test_array , 'updated_data' : new_data['profit']});

  }

  }

  static null_bet = async(req, res)=>{

    // let id = req.body['id'];
    let leagueid = req.body['league'];
    let s_first = req.body['first'];
    let s_second = req.body['second'];

    if(!leagueid || leagueid == 'undefined' || !s_first || s_first == 'undefined' || !s_second || s_second == 'undefined'){
      return res.send({err : '<h1>SORRY SOMETHING WENT WRONG WITH LEAGUE ID</h1>'});
    }else{

    leagueid = parseInt(leagueid);
    s_first = parseInt(s_first);
    s_second = parseInt(s_second);

    let results = {};
    let obj = {home : s_first , away : s_second}
    results[leagueid] = obj;
    let settled = [];
    let bets = {};

    // add another querry parameter league id , cause if one user places two bets then he will get double rebade ammount; and this id you will get from user;

    let all_unsettled_bets = await Bet.find({settled : false , league_type : 1 , leagueId : leagueid} , {bAmmount : 1 , leagueId : 1 , inv : 1 , scoreDetails : 1 , profit : 1 , date : 1 , members : 1 , ammount : 1 , final_score : 1 , rebade_amm : 1});

    if (all_unsettled_bets !== 'undefined' && all_unsettled_bets) {
      if(Object.keys(all_unsettled_bets).length == 0){
        return res.send({err : "id not found" })
      }
    }else{
      return res.send({err : 'something went wrong'});
    }


    // setting things up
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0 ){

      for(let item of all_unsettled_bets){

        if( !(item['leagueId'] in results) ){
         return res.send({err : `<h1>ODD ONE OUT PLEASE ${item['leagueId']}</h1>`});
        }else{
          //this bets object will help me fin wethere a user has placed bet or not in O(1);
          bets[item['inv']] = item;

        }

      }

    }


    let test_array = [];
    // analyze all the data
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0){

      for(let level0 of all_unsettled_bets){

        let body = {
          inv : level0['inv'],
          leagueId : level0['leagueId'],
          amount : 0,
          profit : 0,
          rebade : 0,
          score_a : 0,
          score_b : 0,
        }

        let level1_rebade = 0 ;
        let level2_rebade = 0 ;
        let level3_rebade = 0 ;

        // console.log(level0);
        let score0 = results[level0['leagueId']];
        let test_amount = 0;
        let test_profit = 0;
        // console.log(results , level0['leagueId']);
        let score_a = parseInt(score0['home']);
        let score_b = parseInt(score0['away']);

        if(level0['scoreDetails'][0]['first'] !== score_a ||
        level0['scoreDetails'][0]['second'] !== score_b)
        {

          let profit0 = parseFloat(level0['profit']);
          let bet_ammount0 = parseFloat(level0['bAmmount']);

          body['amount'] = bet_ammount0 + (bet_ammount0/100 * profit0 - 1);

          body['profit'] = parseFloat(parseFloat(bet_ammount0/100 * profit0 - 1).toFixed(3));

        }

        body['score_a'] = score_a;
        body['score_b'] = score_b;

        // find level 1 users

        let level1_user = await User.find({parent : parseInt(level0['inv']) });

        if(level1_user){

          for(let level1 of level1_user){

            if(level1['inv'] in bets){

              if(bets[level1['inv']]['scoreDetails'][0]['first'] !== score_a ||
              bets[level1['inv']]['scoreDetails'][0]['second'] !== score_b)
              {

                let profit1 = parseFloat((bets[level1['inv']]['profit']).toFixed(3));
                let bet_ammount1 = parseFloat(parseFloat(bets[level1['inv']]['bAmmount']).toFixed(3));

                level1_rebade += parseFloat( (bet_ammount1/100 * profit1).toFixed(3) );

              }

            }

            let level2_user = await User.find({parent : parseInt(level1['inv'])});

            if(level2_user){

              for(let level2 of level2_user){

                if(level2['inv'] in bets){


                  if(bets[level2['inv']]['scoreDetails'][0]['first'] !== score_a ||
                  bets[level2['inv']]['scoreDetails'][0]['second'] !== score_b)
                  {

                    let profit2 = parseFloat(bets[level2['inv']]['profit']);
                    let bet_ammount2 = parseFloat(bets[level2['inv']]['bAmmount']);

                    level2_rebade += (bet_ammount2/100) * profit2;

                  }


                }

                let level3_user = await User.find({parent : level2['inv']});

                if(level3_user){

                  for(let level3 of level3_user){

                    if(level3['inv'] in bets){

                      if(bets[level3['inv']]['scoreDetails'][0]['first'] !== score_a ||
                      bets[level3['inv']]['scoreDetails'][0]['second'] !== score_b)
                      {

                        let profit3 = parseFloat(bets[level3['inv']]['profit']);
                        let bet_ammount3 = parseFloat(bets[level3['inv']]['bAmmount']);


                        level3_rebade += parseFloat(((bet_ammount3/100) * profit3).toFixed(3));

                      }

                    }

                  }

                }

              }

            }

          }

        }


        let final_rebade1 = parseFloat( ((parseFloat(level1_rebade)/100 ) * 12).toFixed(3) );
        let final_rebade2 = parseFloat( ((parseFloat(level2_rebade)/100 ) * 10).toFixed(3) );
        let final_rebade3 = parseFloat( ((parseFloat(level3_rebade)/100 ) * 8).toFixed(3) );

        body['rebade'] = parseFloat( (final_rebade1 + final_rebade2 + final_rebade3).toFixed(3) );

        test_array.push(body);
      }

    }


    let new_data = [];

    if(test_array){

      for(let update_it of test_array){

        let set_score_a = parseInt(update_it['score_a']);
        let set_score_b = parseInt(update_it['score_b']);
        let to_update_amm = parseFloat( (update_it['amount'] + update_it['rebade']).toFixed(3) );

        let updated_data = await User.findOneAndUpdate(
          {inv : update_it['inv']} ,
          {
            $inc : {
              Ammount : to_update_amm,
              RebadeBonus : parseFloat(parseFloat(update_it['rebade']).toFixed(3)),
              profit : parseFloat(parseFloat(update_it['profit']).toFixed(3))
            },
          }
        );

        let updated_bet = await Bet.findOneAndUpdate(
          {inv : update_it['inv'] , leagueId : update_it['leagueId']} ,
          {
            settled : true,
            final_score : [{first : set_score_a , second : set_score_b}]
          },{new : true}
        );

        new_data.push(updated_data);

      }
    }

    return res.send({'settled_bets' : test_array , 'updated_data' : new_data['profit']});

  }

  }

  static test_settle_bet = async(req, res)=>{

    let id = req.body['id'];

    if(!id || id == 'undefined'){
      return res.send({err : '<h1>SORRY SOMETHING WENT WRONG WITH LEAGUE ID</h1>'});
    }else{


    let results = {961939 : {home : 3 , away : 0}};
    let settled = [];
    let bets = {};

    // add another querry parameter league id , cause if one user places two bets then he will get double rebade ammount; and this id you will get from user;

    let all_unsettled_bets = await Bet.find({settled : false , league_type : 1 , leagueId : id} , {bAmmount : 1 , leagueId : 1 , inv : 1 , scoreDetails : 1 , profit : 1 , date : 1 , members : 1 , ammount : 1 , final_score : 1 , rebade_amm : 1});

    if (all_unsettled_bets !== 'undefined' && all_unsettled_bets) {
      if(Object.keys(all_unsettled_bets).length == 0){
        return res.send({err : "id not found" })
      }
    }else{
      return res.send({err : 'something went wrong'});
    }

    if( all_unsettled_bets){

      let data = await get_settled_bet_byID(parseInt(all_unsettled_bets[0]['leagueId']));
      data = await JSON.parse(data);

      if(data && data['response'].length){

        let result_id = parseInt(data['response'][0]['fixture']['id']);
        let result_obj = data['response'][0]['goals'];

        results[result_id] = result_obj;

      }else{
        return res.send(`<h1>Something went wrong try again. after checking the database or league id you entered !!!</h1>`);
      }

    }else{
      return res.send({err : 'Either their is no bet to settle or you have entered wrong league id'});
    }

    // setting things up
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0 ){

      for(let item of all_unsettled_bets){

        if( !(item['leagueId'] in results) ){
         return res.send({err : `<h1>ODD ONE OUT PLEASE ${item['leagueId']}</h1>`});
        }else{
          //this bets object will help me fin wethere a user has placed bet or not in O(1);
          bets[item['inv']] = item;

        }

      }

    }


    let test_array = [];
    // analyze all the data
    if(all_unsettled_bets && Object.keys(all_unsettled_bets[0]).length > 0){

      for(let level0 of all_unsettled_bets){

        let body = {
          inv : level0['inv'],
          leagueId : level0['leagueId'],
          amount : 0,
          profit : 0,
          rebade : 0,
          score_a : 0,
          score_b : 0,
        }

        let level1_rebade = 0 ;
        let level2_rebade = 0 ;
        let level3_rebade = 0 ;

        // console.log(level0);
        let score0 = results[level0['leagueId']];
        let test_amount = 0;
        let test_profit = 0;
        // console.log(results , level0['leagueId']);
        let score_a = parseInt(score0['home']);
        let score_b = parseInt(score0['away']);

        if(level0['scoreDetails'][0]['first'] !== score_a ||
        level0['scoreDetails'][0]['second'] !== score_b)
        {

          let profit0 = parseFloat(level0['profit']);
          let bet_ammount0 = parseFloat(level0['bAmmount']);

          body['amount'] = bet_ammount0 + (bet_ammount0/100 * profit0 - 1);

          body['profit'] = parseFloat(parseFloat(bet_ammount0/100 * profit0 - 1).toFixed(3));

        }

        body['score_a'] = score_a;
        body['score_b'] = score_b;

        // find level 1 users

        let level1_user = await User.find({parent : parseInt(level0['inv']) });

        if(level1_user){

          for(let level1 of level1_user){

            if(level1['inv'] in bets){

              if(bets[level1['inv']]['scoreDetails'][0]['first'] !== score_a ||
              bets[level1['inv']]['scoreDetails'][0]['second'] !== score_b)
              {

                let profit1 = parseFloat((bets[level1['inv']]['profit']).toFixed(3));
                let bet_ammount1 = parseFloat(parseFloat(bets[level1['inv']]['bAmmount']).toFixed(3));

                level1_rebade += parseFloat( (bet_ammount1/100 * profit1).toFixed(3) );

              }

            }

            let level2_user = await User.find({parent : parseInt(level1['inv'])});

            if(level2_user){

              for(let level2 of level2_user){

                if(level2['inv'] in bets){


                  if(bets[level2['inv']]['scoreDetails'][0]['first'] !== score_a ||
                  bets[level2['inv']]['scoreDetails'][0]['second'] !== score_b)
                  {

                    let profit2 = parseFloat(bets[level2['inv']]['profit']);
                    let bet_ammount2 = parseFloat(bets[level2['inv']]['bAmmount']);

                    level2_rebade += (bet_ammount2/100) * profit2;

                  }


                }

                let level3_user = await User.find({parent : level2['inv']});

                if(level3_user){

                  for(let level3 of level3_user){

                    if(level3['inv'] in bets){

                      if(bets[level3['inv']]['scoreDetails'][0]['first'] !== score_a ||
                      bets[level3['inv']]['scoreDetails'][0]['second'] !== score_b)
                      {

                        let profit3 = parseFloat(bets[level3['inv']]['profit']);
                        let bet_ammount3 = parseFloat(bets[level3['inv']]['bAmmount']);


                        level3_rebade += parseFloat(((bet_ammount3/100) * profit3).toFixed(3));

                      }

                    }

                  }

                }

              }

            }

          }

        }


        let final_rebade1 = parseFloat( ((parseFloat(level1_rebade)/100 ) * 12).toFixed(3) );
        let final_rebade2 = parseFloat( ((parseFloat(level2_rebade)/100 ) * 10).toFixed(3) );
        let final_rebade3 = parseFloat( ((parseFloat(level3_rebade)/100 ) * 8).toFixed(3) );

        body['rebade'] = parseFloat( (final_rebade1 + final_rebade2 + final_rebade3).toFixed(3) );

        test_array.push(body);
      }

    }


    let new_data = [];

    if(test_array){

      for(let update_it of test_array){

        let set_score_a = parseInt(update_it['score_a']);
        let set_score_b = parseInt(update_it['score_b']);
        let to_update_amm = parseFloat( (update_it['amount'] + update_it['rebade']).toFixed(3) );
      }
    }
    // console.log(test_array);
    return res.send({'settled_bets' : test_array , 'updated_data' : new_data['profit']});

  }

  }

  static get_settle_deposit_data = async(req, res)=>{

    let {invitation_code , amount , transactioin_id} = req.body;

    invitation_code = parseInt(invitation_code);
    amount = parseFloat(amount);

    if(!invitation_code || !amount){
      res.send({status : 2});
    } else {

      let deposit_data = await Deposit.findOne({inv : invitation_code , transactioin_id : transactioin_id , status : 0});

      if(deposit_data !== 'undefined' && deposit_data){

        let user_data = await User.findOne({inv : invitation_code} , {Ammount : 1 , inv : 1 , parent : 1 , max_deposit : 1});
        let parent =  await User.findOne({inv : user_data['parent'] } , {Ammount : 1});

        req.session.max_deposit = user_data['max_deposit'];

        return res.send({parent , user_data , deposit_data});

      }else{
        return res.send({status : 3}); //data not found
      }

    }

  }

  static settle_deposit = async(req , res) => {

    let {invitation_code , amount , transactioin_id} = req.body;

    if(invitation_code && amount && transactioin_id){

      amount = parseFloat(amount);

      let parent_profit = 0;
      let user_profit = 0;
      let vip = 0;


        if( amount >= 1000 && amount <=3999 ){
           user_profit = 120;
           parent_profit = 70;
         }
        else if( amount >= 4000 && amount <=8999 ){
          user_profit = 360;
          parent_profit = 190;
        }
        else if( amount >= 9000 && amount <= 17999){
          parent_profit = 420;
          user_profit = 800;
        }
        else if( amount >= 18000 &&  amount <= 40999){
          user_profit = 2200;
          parent_profit = 1200;
        }
        else if( amount >= 41000){
          user_profit = 12000;
          parent_profit = 2400;
        }
        // setting the vip levels;
        if( amount >= 6999 && amount <= 13999){
          vip = 1;
        }
        else if( amount >= 13999 && amount <= 26999){
          vip = 2;
        }
        else if( amount >= 26999 && amount <= 52999){
          vip = 3;
        }
        else if( amount >=52999 && amount <= 104999){
          vip = 4;
        }else if(amount >= 104999){
          vip = 5;
        }

      // update the amount of both user and parent and send the data to admin;
      let user_data = await User.findOne({inv : invitation_code})

      if( !user_data || user_data == 'undefined' || user_data['first_deposit'] == 'undefined'){
        return res.send({status : 'DATA NOT FOUND CHECK THE DATABASE '})
      }


      if(user_data['first_deposit'] === true){

        parent_profit = parseFloat(parent_profit.toFixed(3));
        let multiple_invitation_bonus = 0;

        // updating the parent
        if(user_data['parent'] !== 0){

          let updated_parent = await User.findOneAndUpdate({inv : user_data['parent']} ,
            {
             $inc : {
             Ammount : parent_profit,
             promotion_bonus : parent_profit,
             BonusMemberCnt : 1
              },
            } , {new : true});

          if(updated_parent && updated_parent !== 'undefined' && updated_parent['BonusMemberCnt'] >= 5){

            switch (updated_parent['BonusMemberCnt']) {
              case 5:
               multiple_invitation_bonus = 400;
               break;
              case 15:
                multiple_invitation_bonus = 900;
                break;
              case 30:
                multiple_invitation_bonus = 2000;
                break;
              case 60:
                multiple_invitation_bonus = 4500;
                break;
              case 110:
                multiple_invitation_bonus = 9000;
                break;
            }

              await User.findOneAndUpdate({inv : user_data['parent']} , { $inc : {
                Ammount : multiple_invitation_bonus,
                promotion_bonus : multiple_invitation_bonus,
                max_deposit : multiple_invitation_bonus,
                } });

          }

        }



        // updating the user;
        let value = amount + user_profit;
        value = parseFloat(value.toFixed(3))
        await User.findOneAndUpdate({inv : invitation_code} ,
          {
            $inc : {Ammount : value , deposit : amount ,  promotion_bonus : user_profit},
            first_deposit : false,
            vipLevel : vip,
            max_deposit : amount,
          });
        await Deposit.findOneAndUpdate({inv : invitation_code , transactioin_id : transactioin_id} , {status : 1 });

        return res.send({'Amount updated by ' : amount + user_profit , 'parent updated by' : parent_profit , 'multiple invitation bonus' : multiple_invitation_bonus});

      }else{

        amount = parseFloat(amount.toFixed(3));

         if(req.session.max_deposit !== 'undefined' && req.session.max_deposit && req.session.max_deposit > amount){
           await User.findOneAndUpdate({inv : invitation_code} ,
           {
             $inc : {Ammount : amount , deposit : amount},
             vipLevel : vip,
             max_deposit : amount
           });
         }else{

           await User.findOneAndUpdate({inv : invitation_code} ,
           {
             $inc : {Ammount : amount , deposit : amount},
             vipLevel : vip
           });

         }

        await Deposit.findOneAndUpdate({inv : invitation_code ,  transactioin_id : transactioin_id} , {status : 1});
        parent_profit = 0;
        return res.send({'ammount update by ' : amount });

      }


    }else{
      return res.send({status : 3});
    }

  }

  static settle_withdrawal = async(req , res)=>{

    let {id , amount , transactioin_id } = req.body;
    if(!id || id == 'undefined' || !amount || amount == 'undefined'){
      return res.send({status : "Enter a invitation code first"});
    }else{
      id = parseInt(id);
      amount = parseFloat(amount);

      await User.findOneAndUpdate({inv : id} , {
        $inc : {
           withdrawalAmmount : amount ,
           Withdrawals : 1
         }
      });

      let data = await Withdrawal.findOneAndUpdate({inv : id , transactioin_id : transactioin_id , Ammount : amount , status : 0} , {
        status : 1
      }, {new : true})

      return res.send({status : data});
    }

  }

  static done_some_shit = async(req , res)=>{

    let id = req.body.league_id;

    if(id && id !== 'undefined'){

      id = parseInt(id);
      let bets_to_fix = await Bet.find({leagueId : id , settled : true});

      if(bets_to_fix){
        if(Object.keys(bets_to_fix[0].length > 0) ){

          for(let bet of bets_to_fix){

            await User.findOneAndUpdate(
              {inv : bet['inv']} ,
              {
                $inc : {
                  Ammount : parseFloat(bet['bAmmount']),
                  betPlayed : -1
                },

              }
            );
            let x = await Bet.findOneAndUpdate(
              {inv : bet['inv']} ,
              {
                final_score : [{first : -1 , second : -1}],
                settled : true,
              },{new : true}
            );
            console.log(x);
          }
         return res.send({status : 'fixed'});
        }else{
          return res.send({err : 'no bets to delete'});
        }

      }else{
        return res.send({err : 'something went wrong'})
      }
    }else{
      return res.send({err : 'enter a valid league id'})
    }

  }

  static virtual_settle = async(req,res)=>{

    let id = req.body.league_id;
    let results = {};
    let final_res = [];

    if(id && id != 'undefined'){
      id = parseInt(id);
      let bets_to_settle = await Bet.find({leagueId : id , settled : false , league_type : 0});

      let update_amm = 0;
      let update_profit = 0;

      if(bets_to_settle){
        if(Object.keys(bets_to_settle[0]).length > 0){

          let data = await get_settled_bet_byID(id);
          data = await JSON.parse(data);

          if(data && data['response'].length){

            let result_id = parseInt(data['response'][0]['fixture']['id']);
            let result_obj = data['response'][0]['goals'];

            results[result_id] = result_obj;

          }else{
            return res.send(`<h1>Something went wrong try again. after checking the database or league id you entered !!!</h1>`);
          }

          let score0 = results[bets_to_settle[0]['leagueId']];
          // console.log(results , bets_to_settle[0]['leagueId']);

          let score_a = parseInt(score0['home']);
          let score_b = parseInt(score0['away']);

          for(let bet of bets_to_settle){

            if(parseInt(bet['scoreDetails'][0]['first']) !== score_a ||
            parseInt(bet['scoreDetails'][0]['second']) !== score_b)
            {

              let profit0 = parseFloat(bet['profit']);
              let bet_ammount0 = parseFloat(bet['bAmmount']);

               update_amm = bet_ammount0 + ( ((bet_ammount0/100) * profit0 )- 1);

               update_profit = parseFloat( (bet_ammount0 - update_amm).toFixed(3));

            }

            let updated_bet = await Bet.findOneAndUpdate(
              {inv : bet['inv'] , leagueId : bet['leagueId'] , settled : false} ,
              {
                settled : true,
                final_score : [{first : score_a , second : score_b}]
              },{new : true}
            );

            await User.findOneAndUpdate({inv : bet['inv']} , {$inc : {
                 Ammount : update_amm,
                 profit  : update_profit
              }
            });
            final_res.push(updated_bet);
          }
          return res.send({status : final_res});
        }else{
          return res.send({err : 'no bets to settle'});
        }
      }else{
        return res.send({err : 'something went wrong'});
      }

    }else{
      return res.send({err : "id is not valid"})
    }


  }

  static deposit_find = async(req, res)=>{
    let deposit_data = await Deposit.find();
    let revenue_generated = 0;
    if( Object.keys(deposit_data[0]).length > 0  ){

      for(let deposit of deposit_data){
        revenue_generated += parseFloat(deposit['Ammount']);
      }

      return res.send({'revenue' : revenue_generated});
    }else{
      return res.send({'err' : 'something went wrong'});
    }

  }

  static cancel_withdrawal = async(req, res)=>{
    let {amount , transactionid , inv_code} = req.body;

    if(!amount || amount == 'undefined' || !transactionid || transactionid =='undefined' || !inv_code || inv_code == 'undefined'){
      return res.send({err : 'enter valid values'});
    }else{
      amount = parseFloat(amount);
      inv_code = parseInt(inv_code);

      let withdrawal = await Withdrawal.findOne({Ammount : amount , transactioin_id : transactionid , inv : inv_code , status : 0})

      if(withdrawal){
        let deduct_amount = amount - 2*amount;
        await Withdrawal.findOneAndUpdate({Ammount : amount , transactioin_id : transactionid , inv : inv_code , status : 0} , {status : 2});
        await User.findOneAndUpdate({inv : inv_code} , {$inc : {
          Ammount : amount ,
          day_withdrawal : -1 ,
          Withdrawals : -1 ,
          withdrawalAmmount : deduct_amount
        }});
        return res.send({done : 'it was fixed'});
      }else{
        return res.send({err : 'no data found'});
      }

    }

  }

}

module.exports =  admin_function;


async function get_settled_bet_byID(id){

  var options = {
  method: 'GET',
  url: `https://v3.football.api-sports.io/fixtures`,
  qs: {id : id},
  headers : {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": "021ae6685ec46e47ec83f8848ac1d168"
      // "x-rapidapi-key": "823296afa77a4989062591abc46178ee"
    }

};

  return new Promise(function (resolve, reject) {
  request(options , function (error, res, body) {
    if (!error && res.statusCode === 200) {
      resolve(body);
     } else {
      reject(error);
     }
   });
 });

}

async function get_settled_bet_today(){

  let date = new Date();

  var options = {
  method: 'GET',
  url: `https://v3.football.api-sports.io/fixtures/?date=${date.getFullYear() - 5}-${date.getMonth() + 1}-${date.getDate()}`,
  qs: {status:'FT'},
  headers : {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": "021ae6685ec46e47ec83f8848ac1d168"
      // "x-rapidapi-key": "823296afa77a4989062591abc46178ee"
    }

};

  return new Promise(function (resolve, reject) {
  request(options , function (error, res, body) {
    if (!error && res.statusCode === 200) {
      resolve(body);
     } else {
      reject(error);
     }
   });
 });

}
