export function isAllowedAdminEmail(email?:string,allowedEmail='djfjjd@gmail.com'){
  return Boolean(email&&email.trim().toLowerCase()===allowedEmail.trim().toLowerCase());
}
