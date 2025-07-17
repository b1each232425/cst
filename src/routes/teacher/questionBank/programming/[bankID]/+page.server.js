
export function load({ params }) {
    
    let bank_name = ""

    if(params.bankID == "newBank"){
        bank_name = "未命名题库"
    }
    
    return {
        
        id: params.bankID,
        
        name: bank_name,
        
        /**
         * @type {string[]}
         */
        tags: ["示例"],
    }
}