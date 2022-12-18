
  let tag = document.querySelector('#res_data');

document.querySelector('#settle_bet').addEventListener('click' , async()=>{

    let id = document.querySelector('input').value;

    if(id){

      let data = {'id' : id};

      const config = {
        method : 'POST',
        headers:{
         'content-type' : 'application/json'
        },
        body :  await JSON.stringify(data)
      }

      let response = await fetch('/AdMiNgRoUp/league_0' , config);
      response = await response.json();
      tag.innerText = JSON.stringify(response);

    }else{
      alert('CHECK THE ID !!!!');
    }

  });

document.querySelector('#get_deposit_data').addEventListener('click' , async ()=>{

  let amount = document.querySelector('#amount').value;
  let transaction = document.querySelector('#transaction').value;
  let inv = document.querySelector('#invitation').value;

  amount = parseFloat(amount);

  if(!amount || !transaction || !inv){
    alert('provide all data first');
    return ;
  }

  let data = {
    'invitation_code' : inv,
    'amount' : amount,
    'transactioin_id' : transaction
  }
  // data = await JSON.stringify(data);

  const config = {
    method : 'POST',
    headers:{
     'content-type' : 'application/json'
    },
    body :  await JSON.stringify(data)
  }

  let response = await fetch('/gather-deposit-data' , config);
  response = await response.json();

  if(response['status'] == 2){
    alert('enter a valid amount or transaction id ');
    return;
  }else if (response['status'] == 3) {
    alert('DATA NOT FOUND CHECK IN DATABASE');
    return;
  }else{

    tag.insertAdjacentHTML('beforeend','<h2>parent data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['parent']));
    tag.insertAdjacentHTML('beforeend','<h2>user data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['user_data']));
    tag.insertAdjacentHTML('beforeend','<h2>deposit data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['deposit_data']));

  }

})

document.querySelector('#settle_deposit').addEventListener('click' , async()=>{

  let amount = document.querySelector('#amount').value;
  let transaction = document.querySelector('#transaction').value;
  let inv = document.querySelector('#invitation').value;
  amount = parseFloat(amount);

  if(!amount || !transaction || !inv){
    alert('provide all data first');
    return ;
  }

  let data = {
    'invitation_code' : inv,
    'amount' : amount,
    'transactioin_id' : transaction
  }

  const config = {
    method : 'POST',
    headers:{
     'content-type' : 'application/json'
    },
    body :  await JSON.stringify(data)
  }

  let response = await fetch('/settle_deposit' , config);
  response = await response.json();

  if(response['status'] == 2){
    alert('enter a valid amount or transaction id ');
    return;
  }else if (response['status'] == 3) {
    alert('DATA NOT FOUND CHECK IN DATABASE');
    return;
  }else{
    tag.innerText = await JSON.stringify(response);
  }


})

document.querySelector('#settle_withdrawal').addEventListener('click' , async()=>{
  let details = document.querySelectorAll('.withdrawal_inpt');
  let data = {
    id : details[0].value,
    transactioin_id : details[1].value,
    amount : details[2].value,
  }

  if(!details[0].value || !details[1].value || !details[2].value){
    alert("enter all the details first");
    return;
  }

  const config = {
    method : 'POST',
    headers : {
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(data)
  };

  let res = await fetch('/settle_withdrawal' , config);
  res = await res.json();

  if(res['status']){
    tag.innerText = await JSON.stringify(res['status']);
  }else{
    tag.innerText = res['status'];
  }

})

document.querySelector('#shit_happened').addEventListener('click' , async ()=>{
  let value = document.querySelector('#shit_league_id').value;
  if(!value || value == 'undefined'){
    alert('enter the value first')
    return ;
  }
  let body = {
    league_id : parseInt(value)
  }
  const config = {
    method : 'POST',
    headers : {
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(body)
  }

  let res = await fetch('/shit_happened' , config);
  res = await res.json();

  document.querySelector('#res_data').innerText = await JSON.stringify(res);

})

document.querySelector('#virtual_settle').addEventListener('click' , async ()=>{
  let value = document.querySelector('#virtual_settle_league_id').value;
  if(!value || value == 'undefined'){
    alert('enter the value first')
    return ;
  }
  let body = {
    league_id : parseInt(value)
  }
  const config = {
    method : 'POST',
    headers : {
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(body)
  }

  let res = await fetch('/virtual_settle' , config);
  res = await res.json();

  document.querySelector('#res_data').innerText = await JSON.stringify(res);

})

document.querySelector("#cancel_withdrawal").addEventListener('click' , async()=>{
  let inv_code = document.querySelector("#WC_inv_code").value;
  let transaction_id = document.querySelector('#WC_transaction').value;
  let amount = document.querySelector('#WC_amount').value;

  if(!inv_code || !transaction_id || !amount){
    alert('Enter all the data first');
    return ;
  }

  let body = {
    amount : amount,
    transactionid : transaction_id,
    inv_code : inv_code
  }

  let config = {
    method : 'POST',
    headers : {
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(body)
  }

  let res = await fetch('/cancel_withdrawal' , config);
  res = await res.json();

  document.querySelector('#res_data').innerText = await JSON.stringify(res);
})

document.querySelector('#null_btn').addEventListener('click' , async()=>{
  let league = document.querySelector('#null_league').value;
  let first = document.querySelector('#null_first').value;
  let second = document.querySelector('#null_second').value;
  // console.log(league , first , second);
  if(league && first && second){

    let data = {
      league : league,
      first : first,
      second : second,
    };

    const config = {
      method : 'POST',
      headers:{
       'content-type' : 'application/json'
      },
      body :  await JSON.stringify(data)
    }

    let response = await fetch('/null_settlement' , config);
    response = await response.json();
    tag.innerText = JSON.stringify(response);

  }else{
    alert('CHECK THE ID !!!!');
  }

})

document.querySelector('#test_settle_bet').addEventListener('click' , async()=>{

    let id = document.querySelector('#test_settle_id').value;

    if(id){

      let data = {'id' : id};

      const config = {
        method : 'POST',
        headers:{
         'content-type' : 'application/json'
        },
        body :  await JSON.stringify(data)
      }

      let response = await fetch('/test_settle_bets' , config);
      response = await response.json();
      tag.innerText = JSON.stringify(response);

    }else{
      alert('CHECK THE ID !!!!');
    }

  });
