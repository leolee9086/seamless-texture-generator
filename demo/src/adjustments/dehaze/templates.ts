export const dehazeFailed = (error:Error):String=>{
return  `去雾处理失败: ${error instanceof Error ? error.message : String(error)}`
}