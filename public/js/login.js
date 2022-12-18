
let signup_page = document.querySelector('#signup-section');
let login_page =  document.querySelector('#Login-section');

document.querySelector('#signup').addEventListener('click', ()=>{
    signup_page.style.left = "0%";
    login_page.style.left = '-100vw';
})

document.querySelector('#return').addEventListener('click', ()=>{
    signup_page.style.left = "-100vw";
    login_page.style.left = '0';
})



// login fetch call;

document.querySelector('#login').addEventListener('click' , async function(e){

  // e.preventDefault();

  let l_name = document.querySelector('input[name = "l-name"]');
  let l_password = document.querySelector('input[name = "l-pass"]');

  if(!l_name.value || !l_password.value){
    l_name.placeholder = "MANDETORY FIELD";
    l_password.placeholder = "MANDETORY FIELD";
    return;
  }

  l_name = l_name.value;
  l_password = l_password.value;

  const data = {
    name : l_name,
    pass : l_password
  }
  const config = {
    method : 'POST',
    headers:{
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(data)
  }

  let res = await fetch('./login' , config);
  let res_data = await res.json();
  console.log(res_data);
  if(res_data['status'] == 1){
    window.location.href = window.location.origin + '/home';
  }else{
    window.location.href = window.location.origin + '/login';
  }
})

document.querySelector('#signup_btn').addEventListener('click' , async function(e){

  e.preventDefault();

  let values = document.querySelectorAll('.sign-input')
  let name = values[0].lastElementChild.value;
  let s_pass = values[1].lastElementChild.value;
  let s_pass_match = values[2].lastElementChild.value;
  let s_inv_code = values[3].lastElementChild.value;
  let s_contact = values[4].lastElementChild.value;
  console.log(s_contact);
  s_inv_code = (s_inv_code === '')? 0 : s_inv_code;

  if(s_pass.localeCompare(s_pass_match) !== 0 || !name){
    values[2].lastElementChild.value = '';
    values[2].lastElementChild.placeholder = 'NO MATCHED';
    return;
  }else if(s_contact.length !== 10){
    values[4].lastElementChild.style.border = '2px solid red';
    values[4].value = '';
    return;
  }else{


  const data = {
    name,
    password : s_pass,
    invitation_code : s_inv_code,
    contact : s_contact
  }
  const config = {
    method : 'POST',
    headers : {
      'content-type' : 'application/json'
    },
    body : await JSON.stringify(data)
  }

  let res = await fetch('./signup' , config);
  let res_data = await res.json();

  if(res_data){

    if(res_data.status === 404){ //name already exits

      values[0].lastElementChild.value = ""
      values[0].lastElementChild.style.color = 'red';
      values[0].lastElementChild.placeholder = 'NAME ALREADY EXIST';

    }else if (res_data.status === 101) {  //phone number already exits

      values[4].lastElementChild.value = '';
      values[4].lastElementChild.style.color = 'red'
      values[4].lastElementChild.placeholder = 'NUMBER ALREADY EXIST';

    }else if(res_data.status === 0){ //someting went wrong
      window.location.reload();
    }else if(res_data.status === 1){ //user created
      window.location.href = window.location.origin + '/home';
    }
  }

  return;
 }
})
