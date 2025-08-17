import {  describe,expect, vi, it } from 'vitest';
import {  render,screen,fireEvent ,waitFor} from '@testing-library/svelte';
import PracticeForm from '../_components/PracticeForm.svelte'
import { toast } from '$lib/components/Toast/Toast';

vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

     const mockPractice={  Action : "POST",
              Data:{
                  practice: {
                    Name: '练习',
                    CorrectMode: '00',
                    PaperID: 123,
                    Type : '00',
                    AllowedAttempts: 3,                                                                            
                    duration:2
                },
                 student: [{
                     StudentID: 123,
                     StudentName: '学生1'
                 }],
              }}

describe('createPractice', () => {
  it('should render', () => {
    const { getByText } = render(PracticeForm);
    expect(getByText('选择试卷')).toBeInTheDocument();
  });
});

describe('创建练习请求测试',(()=>{
  
    it('正常创建练习',(async()=>{
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ "status": 0,
  "msg": "success",
  "rowCount": 1,
  "API": "/api/paper",
  "method": "GET",
  "data": [
    {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "00",
      "Category": "00",
      "Level": "00",
      "SuggestedDuration": 120,
      "Description": null,
      "Tags": [],
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": 1753104023766,
      "UpdatedBy": null,
      "UpdateTime": null,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    },
     {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "02",
      "Category": "00",
      "Level": "02",
      "SuggestedDuration": 120,
      "Description": null,
      "Tags": [],
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": null,
      "UpdatedBy": null,
      "UpdateTime": 1753104023766,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    },
     {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "04",
      "Category": "00",
      "Level": "04",
      "SuggestedDuration": 120,
      "Description": null,
      
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": null,
      "UpdatedBy": null,
      "UpdateTime": 1753104023766,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    }
  ] })
        });
        render(PracticeForm, { data: mockPractice });

        const nameInput = screen.getByPlaceholderText('请输入练习名称');
         fireEvent.input(nameInput, { target: { value: '测试练习' } });
        const paperBtn=screen.getByText('选择试卷');
        fireEvent.click(paperBtn);
  

        const confirm = screen.getAllByText('确定');
        fireEvent.click(confirm[0]);

        const radio= screen.getByText('自动批改');
        fireEvent.click(radio);
        
         const radio2= screen.getByText('限制次数');
        fireEvent.click(radio2);
        const createButton = screen.getAllByText('确定');
        fireEvent.click(createButton[1]);
         
    }))

        it('正常创建练习2',(async()=>{
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ "status": 0,
  "msg": "success",
  "rowCount": 1,
  "API": "/api/paper",
  "method": "GET",
  "data": [
    {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "00",
      "Category": "00",
      "Level": "00",
      "SuggestedDuration": 120,
      "Description": null,
      "Tags": [],
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": 1753104023766,
      "UpdatedBy": null,
      "UpdateTime": null,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    },
     {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "02",
      "Category": "00",
      "Level": "02",
      "SuggestedDuration": 120,
      "Description": null,
      "Tags": [],
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": null,
      "UpdatedBy": null,
      "UpdateTime": 1753104023766,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    },
     {
      "ID": 61,
      "Name": "新建试卷",
      "AssemblyType": "04",
      "Category": "00",
      "Level": "04",
      "SuggestedDuration": 120,
      "Description": null,
      
      "Creator": 1,
      "CreatorInfo": {
        "id": null,
        "email": null,
        "account": null,
        "mobile_phone": null,
        "official_name": null
      },
      "CreateTime": null,
      "UpdatedBy": null,
      "UpdateTime": 1753104023766,
      "Status": "00",
      "AccessMode": "00",
      "TotalScore": 0,
      "QuestionCount": 0,
      "GroupCount": null,
      "TableMap": null,
      "Action": "",
      "Condition": "",
      "Expr": "",
      "Values": null,
      "Columns": null,
      "QryResult": null,
      "Result": null,
      "RowCount": 0,
      "AuthExpr": "",
      "AuthWhereValues": null,
      "AuthWhereBeginPos": 0,
      "AuthProc": false
    }
  ] })
        });
        render(PracticeForm, { data: mockPractice });

        const nameInput = screen.getByPlaceholderText('请输入练习名称');
         fireEvent.input(nameInput, { target: { value: '测试练习' } });
        const paperBtn=screen.getByText('选择试卷');
        fireEvent.click(paperBtn);
  

        const confirm = screen.getAllByText('确定');
        fireEvent.click(confirm[0]);
         const radio0= screen.getByText('自动批改');
        fireEvent.click(radio0);

        const radio= screen.getByText('人工批改');
        fireEvent.click(radio);

        const radio2= screen.getByText('限制次数');
        fireEvent.click(radio2);
        
         const radio3= screen.getByText('不限次数');
        fireEvent.click(radio3);
        const createButton = screen.getAllByText('确定');
        fireEvent.click(createButton[1]);
         
    }))

    it('返回ok不为true',(async()=>{
      global.fetch=vi.fn(()=>Promise.resolve({
        ok:false,
        json:()=>Promise.resolve({
          message:'error'
        })
      }))
       render(PracticeForm, { data: mockPractice });
      // 使用 spyOn 来监视 toast.error
  

        const nameInput = screen.getByPlaceholderText('请输入练习名称');
         fireEvent.input(nameInput, { target: { value: '测试练习' } });
        const paperBtn=screen.getByText('选择试卷');
        fireEvent.click(paperBtn);
        await waitFor(() => {
              expect(toast.error).toBeCalledWith('获取数据失败');
            });
    }))
    it('返回的status不为0',(async()=>{
       global.fetch=vi.fn(()=>Promise.resolve({
        ok:true,
        json:()=>Promise.resolve({
          status:1,
          message:'error'
        })
      }))
       render(PracticeForm, { data: mockPractice });
      // 使用 spyOn 来监视 toast.error
  

        const nameInput = screen.getByPlaceholderText('请输入练习名称');
         fireEvent.input(nameInput, { target: { value: '测试练习' } });
        const paperBtn=screen.getByText('选择试卷');
        fireEvent.click(paperBtn);
        await waitFor(() => {
              expect(toast.error).toBeCalledWith('获取数据失败');
            });
    }))
}))

describe('打开选择学生界面',(()=>{
  it('测试打开选择学生界面',(()=>{
     render(PracticeForm, { data: mockPractice });
     const studentBtn=screen.getAllByText('选择学生');
     fireEvent.click(studentBtn[0]);
  }))
  it('更新学生显示',(()=>{
     render(PracticeForm, { data: mockPractice });
     const studentBtn=screen.getAllByText('选择学生');
     fireEvent.click(studentBtn[0]);
     fireEvent.click(studentBtn[1]);

  }))

  it('关闭学生选择弹窗',(()=>{
      render(PracticeForm, { data: mockPractice });
     const studentBtn=screen.getAllByText('选择学生');
     fireEvent.click(studentBtn[0]);
     const closeBtn=screen.getAllByText('取消');
     fireEvent.click(closeBtn[1]);

  }))

}))

describe('取消创建练习',(()=>{
  it('点击取消按钮',(()=>{
    render(PracticeForm, { data: mockPractice });
    const cancelBtn=screen.getAllByText('取消');
    fireEvent.click(cancelBtn[0]);
   
    const confirmBtn=screen.getAllByText('确定');
    fireEvent.click(confirmBtn[0]);
  }))
}))

describe('什么都不输入直接点确定',(()=>{
  it('直接点确定',(()=>{
    render(PracticeForm, { data: mockPractice });
    const createBtn=screen.getAllByText('保存');
    fireEvent.click(createBtn[0]);
  }))
}))
