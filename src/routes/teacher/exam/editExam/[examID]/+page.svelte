<!--
 * @Author: yeweixuan t051521@163.com
 * @Date: 2025-07-27 
 * @LastEditors: yeweixuan t051521@163.com
 * @LastEditTime: 2025-8-18 
 * @FilePath: \exam\src\routes\teacher\exam\editExam\[examID]\+page@.svelte
 * @Description: 继续编辑考试页面
 * @Copyright (c) 2025 by yeweixuan t051521@163.com, All Rights Reserved. 
-->
<script>
  //@ts-nocheck
  import { goto } from '$app/navigation';
  import SmartEditor from '@3min/smart-edit';
  import RequiredLabel from '../../_components/RequiredLabel.svelte';
  import PaperSelectionPanel from '../../_components/PaperSelectionPanel.svelte';
  import ExamineeSelectionPanel from '../../_components/ExamineeSelectionPanel.svelte';
  import ExaminationRoomSelectionPanel from '../../_components/ExaminationRoomSelectionPanel.svelte';
  import InvigilatorSelectionPanel from '../../_components/InvigilatorSelectionPanel.svelte';
  import ReviewerSelectionPanel from '../../_components/ReviewerSelectionPanel.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import{onMount} from 'svelte'
  import { page } from '$app/stores';
  import Loading from '$lib/components/Loading/Loading.svelte';
  import { onChooseStartTime, onChooseEndTime,updateDuration,handleSubmit } from '../../_utils/createExam';
  import { createXXHash64 } from 'hash-wasm';
  import { filesize } from 'filesize';
  const TIP_TEXT = {
    final_exam: '当一门考试的考试性质为期末成绩考试时，它将决定学生在此课程的最终期末成绩',
    qualifying_exams: '当一门考试是资格证考试时，学生需要以真实身份进入考试',
    online: '考生可以通过互联网在任何地方登录网站进行考试，无需到特定地点',
    offline: '要求考生到指定的考点机房现场参加考试，并通过网站进行操作',
    fixed: '固定时段考试：考试时长=结束时间-开始时间',
    flexible: '灵活时段考试：考试时长<=结束时间-开始时间，只适用于线上考试',
    auto_mark: '批改方式仅适用于填空题和简答题，其他题型将默认由系统批改，自动批改：AI根据提示词对学生的答案进行打分',
    ai_mark: '批改方式仅适用于填空题和简答题，其他题型将默认使用自动批改，AI批改：根据提示词对学生的答案进行打分',
    multiply_mark: '每位批阅员分别批阅所有考生的试卷，最终得分取平均值',
    assignment_of_paper: '将试卷平分或按一定比例分配给不同批阅员',
    question_group_mark: '每位批阅员负责批阅某一特定题型',
    paper_by_paper: '一次批改一份完整试卷，依次完成所有题目',
    question_by_question: '一次批改一个题型，完成所有试卷的该题型后，再到下一个题型',
  };

  const ASSEMBLY_TYPE_MAP = {
    '00': '自定义组卷',
    '02': '随机组卷',
    '04': '智能刷题',
  };

  const DEFAULT_RULES = `在即将开始的考试之前，请各位考生务必仔细阅读并遵守以下详细规则：
    1. 请确保您的网络连接稳定，建议使用有线网络连接，并使用支持最新版本浏览器的电脑参加考试。
    2. 提前30分钟登录考试平台，完成身份验证和设备检查，以保证准时开考。准备好有效的身份证件以备核查。
    3. 考试环境应安静、无干扰，桌面除必要的文具外不得放置任何与考试无关的物品或参考资料。关闭所有与考试无关的应用程序和通知提醒。
    4. 确保摄像头开启且面向考生，以便监考人员实时监控，考试全程需保持可见。背景应整洁，避免出现可能引起作弊嫌疑的物品。
    5. 不得使用任何通讯工具或电子设备辅助答题，包括手机、平板电脑等。禁止查阅外部资料、与他人交流或寻求帮助。
    6. 一旦进入考试界面，中途不允许离开，如遇特殊情况（如突发健康问题）须提前报告监考老师，并遵循监考老师的指示。
    7. 遵守考试时间限制，系统将在规定时间自动提交试卷。请合理分配答题时间，不要集中在最后一刻提交答案。
    8. 考试期间严禁录屏、录音或以任何形式记录考试内容。违反此规定将被视为作弊行为处理。
    9. 如有任何技术问题或遇到不可抗力因素影响考试进行，请立即联系在线技术支持或监考老师寻求帮助。
    请严格遵守上述规则，祝您考试顺利，取得满意的成绩！`;

  const EDITOR_OPTIONS = {
    editable: true,
    content: DEFAULT_RULES,
    table: {
      overflow: false,
    },
    link: {
      protocols: [],
    },
    disableFileContent: true,
    characterCount: {
      characterCountLimit: 1000,
      enableCharacterCountLimit: true,
    },
    menuBarExcludeKeys: ['attachment', 'audio', 'image', 'video'],
  };
  let tus;
  let criteria = $state('.*');
  let fileApi = '/api/file';
  let endpoint = $state('/api/file');
  const CHUNKSIZE = 1024 * 1024 * 4;
  let chunkSize = $state(CHUNKSIZE);
  let parallelUploads = $state(1);
  let jobs = $state(new Map());
  let uploadedFiles = $state([]);
  let selectedFiles = $state();
  let invigilator_ID = $state();
  let Reviewer_ID = $state([]);
	let clearSelectedFiles = () => {
		selectedFiles = new DataTransfer().files;
	};
  let queryFiles = () => {
		let v = encodeURIComponent(criteria);
		fetch(fileApi + `/nonexistence?q=${v}`)
			.then((v) => {
				let size = v.headers.get('content-length');
				if (!v || size === '0') {
					return [];
				}

				return v.json();
			})
			.then((v) => {
				if (!v || v.length == 0) {
					console.log('empty file list');
					return;
				}

				let d = [];
				for (let i = 0; i < v.length; i++) {
					let metadata = v[i].MetaData;

					// metadata.full = v[i];
					metadata.url = `${fileApi}/${v[i].ID}`;
					if (!metadata.filename) {
						metadata.filename = v[i].ID;
					}

					if (!metadata.filesize) {
						metadata.filesize = v[i].Size;
					}

					if (!metadata.checksum) {
						metadata.checksum = v[i].ID;
					}

					d.push(metadata);
				}
				uploadedFiles = d;
			})
			.catch((err) => {
				console.log(err);
			});
	};
  let fastdigest = (job) => {
		return new Promise(async (resolve, reject) => {
			if (!job || !job.file) {
				reject('invalid/null job');
				return;
			}

			let md = await createXXHash64();
			md.init();

			let fileReader = new FileReader();

			let read = 0;
			fileReader.onload = (e) => {
				if (!e || !e.target || !e.target.result) {
					let err = new Error('invalid event.target.result');
					console.log(err);
					jobs.delete(job.id);
					reject(err);
					return;
				}

				read += e.target.result.byteLength;
				let buf = new Uint8Array(e.target.result);
				md.update(buf);
				seek();
			};

			let fileSize = job.file.size;
			let start = 0,
				end = 0;

			let seek = () => {
				let now = new Date();
				job.sumPerformance =
					(((read * 1.0) / (now.getTime() - beginTime.getTime())) * 1000) / (1024 * 1024);

				job.sumProgress = (((read * 1.0) / fileSize) * 100).toFixed(2);
				if (read >= fileSize) {
					let hex = md.digest();
					resolve(hex);
					return;
				}

				end += CHUNKSIZE;
				end = end < fileSize ? end : fileSize + 1;
				let slice = job.file.slice(start, end);

				fileReader.readAsArrayBuffer(slice);
				start = end;
			};

			let beginTime = new Date();
			seek();
		});
	};
  let examID=$state('');
  //考试名称
  let exam_name = $state('');
  //考试规则
  let exam_rules = $state(DEFAULT_RULES);
  //考试类型
  let exam_type = $state('00');
  //考试方式
  let exam_method = $state('00'); //00线上 02线下
  let exam_examinee = $state([]);
  //考生数量
  let examineeNum = $derived(exam_examinee.length);
  let uploadedFileList = $state([]); // 附件
  let RichTextEditor; //富文本编辑器
  let exam_rooms = $state([]); //考试场地
  let invigilators = $state([]); //监考人员
  let examinee_ID = $state([]);
  //考试场次数组
  let paper_configs = $state([
    {
      paperID: 0,
      paperType: '',
      paperName: '',
      periodMode: '00',
      startTime: '',
      endTime: '',
      duration: 0,
      maxDuration: 0,
      isOptionShuffled: false,
      isQuestionShuffled: false,
      questionShuffledMode: '00',
      markMethod: '00',
      nameVisibility: false,
      markMode: '10',
      gradingConfig: [],
      isHide: false,
      sessionNum: 1,
      markConfig: {
      teacher_mark_configs: [
          // {
          //     id: 0,
          //     name: "",
          // },
        ],
      },
      show_paper_selection_panel: false,
      show_grader_selection_panel: false,
      lateEntryTime: 1,
      earlySubmissionTime: 0,
    },
  ]);
  
  //总时长计算
  let total_duration = $derived(paper_configs.reduce((sum, p) => sum + p.duration, 0));
  let show_paper_selection_panel = $state(false);
  let show_examinee_panel = $state(false);
  let show_rooms_panel = $state(false);
  let show_invigilator_panel = $state(false);
  let loading = $state(true);
  let start_time = $derived(paper_configs.length > 0
        ? new Date(Math.min(...paper_configs.map(config => new Date(config.start_time).getTime())))
        : new Date());

  let end_time = $derived(paper_configs.length > 0
        ? new Date(Math.max(...paper_configs.map(config => new Date(config.end_time).getTime())))
        : new Date());
  
  
  // 计算所有考场容量的总和
  let total_capacity = $derived(exam_rooms.reduce((sum, room) => sum + (room.capacity || 0), 0));

  function addNewPaper() {
    let default_paper_config = {
      paperID: 0, //试卷ID
      paperType: '', //试卷类型
      paperName: '',
      periodMode: '00', //考试时间段模式
      startTime: '',
      endTime: '',
      duration: 0,
      maxDuration: 0,
      isOptionShuffled: false, //是否选项乱序
      isQuestionShuffled: false, //是否题目乱序
      questionShuffledMode: '00',
      markMethod: '00', //批卷方式
      nameVisibility: false,
      markMode: '10', //批改模式
      gradingConfig: [],
      isHide: false,
      sessionNum: 1,
      markConfig: {
        teacher_mark_configs: [
          // {
          //     id: 0,
          //     name: "",
          // },
        ],
      },
      show_paper_selection_panel: false,
      showGraderSelectionPanel: false,
      lateEntryTime: 1,
      earlySubmissionTime: 0,
    };
    
    //保证在没有选择时间的情况下也能新增试卷
     if(paper_configs.length>=1&&paper_configs[paper_configs.length-1].startTime!=''&&paper_configs[paper_configs.length-1].endTime!='')
    {
      const prev = paper_configs.length-1;
      const prevEnd = new Date(paper_configs[prev].endTime);
      const nextStart = new Date(prevEnd);
      nextStart.setHours(prevEnd.getHours() + 1);

      const nextEnd = new Date(nextStart);
      nextEnd.setMinutes(nextStart.getMinutes() + 120); // 默认 120 分钟

      default_paper_config.startTime = nextStart.toISOString();
      default_paper_config.endTime   = nextEnd.toISOString();
     
    }
    paper_configs = [...paper_configs, default_paper_config];
    if(paper_configs.length>=1) {updateDuration(paper_configs.length-1,paper_configs);}
    // 清空考场选择
    exam_rooms = [];
    invigilators = [];
  }

  function resetTime(index) {
    if (paper_configs[index].periodMode === '02') {
      paper_configs[index].duration = 0;
    } else {
      updateDuration(index, paper_configs);
    }
  }
  
  // 获取已选择的试卷ID列表（排除当前索引）
function getSelectedPaperIDs(excludeIndex = -1) {
  return paper_configs
    .map((config, index) => ({ id: config.paperID, index }))
    .filter(item => item.index !== excludeIndex && item.id !== 0)
    .map(item => item.id);
}



  function checkShuffledMode(){
    for(let i = 0; i < paper_configs.length; i++)
    {
      
      if (paper_configs[i].questionShuffledMode = '00') {
          paper_configs[i].isOptionShuffled =1;
          paper_configs[i].isQuestionShuffled=1;
          
      } else if (paper_configs[i].questionShuffledMode = '02') {
        paper_configs[i].isOptionShuffled=1;
        paper_configs[i].isQuestionShuffled=0;
      } 
       else if (paper_configs[i].questionShuffledMode = '04') {
         paper_configs[i].isOptionShuffled=0;  
         paper_configs[i].isQuestionShuffled=1;
       } else {
         paper_configs[i].questionShuffledMode = '06';
       }
    }
  }

  function tusInit() {
		if (!tus || !tus.isSupported) {
			console.log('tus unsupported');
			return;
		}
	}
  async function deleteFiles(file) {
    fetch(`/api/exam/file`,{
      method:"DELETE",
        credentials: "include",
        headers: {
                "Content-Type": "application/json",
            },
        body:JSON.stringify({data:
        {
          exam_id: Number(examID),
          name: file.name,
          size: file.size,
          checksum: file.checksum
        }
      })
  })
  .then((res) => res.json())
  .then((result) => {
    if (result.status === 0) {
      toast.success("删除成功");
      uploadedFileList = uploadedFileList.filter(f => f.checksum !== file.checksum);
    } else {
      toast.warning("删除失败：" + result.msg);
    }
  })
  .catch((err) => {
    console.error(err);
    toast.error("删除失败，未知错误");
  });
  }

  async function uploadFiles(files = selectedFiles){
    let promises = [];
    for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file) {
				continue;
			}

			let id = `${file.name}#${file.size}#${file.lastModified}`;
			let job = { id, file };
			jobs.set(id, job);

			const p = singles(job);
			promises.push(p);
		}
		let results;
		try {
			// var results: [job]
			// job:{ID,file,url}
			results = await Promise.all(promises);
			results.forEach((e) => {
				console.log(`download: ${e.file.name}: ${e.url}`);
			});
		} catch (err) {
			console.log(err);
		}

		
		queryFiles();
    for (const r of results) {
    await fetch('/api/exam/file', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          exam_id: Number(examID),
          checksum: r.checksum,
          name: r.file.name,
          size: r.file.size
        }
      })
    })
    .then((response) => response.json())
    .then((result) => {
        if(result.status !== 0)
        {
          toast.warning('上传出错:',result.msg);
        }
        else{
          uploadedFileList = [
        ...uploadedFileList,
        {
          name: r.file.name,
          size: r.file.size,
          checksum: r.checksum,
          // url: r.url || `${fileApi}/${r.checksum}` // 可选：下载地址
        }
      ];
          reset();
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error('未知错误');
      });
  }
	}

  function encodeMetadata(metadata) {
    const encodedPairs = [];
    for (const [key, value] of Object.entries(metadata)) {
        const encodedValue = btoa(unescape(encodeURIComponent(String(value))));
        encodedPairs.push(`${key} ${encodedValue}`);
    }
    return encodedPairs.join(',');
}

  async function singles(job) {
		return new Promise(async (resolve, reject) => {
			if (!job || !job.file) {
				reject('invalid/null job');
				return;
			}

			job.checksum = await fastdigest(job);
			let metadata = {
				filename: job.file.name,
				filetype: job.file.type,
				filesize: job.file.size,
				lastModified: job.file.lastModified,
				checksum: job.checksum,
			};

			const encodedMetadata = encodeMetadata(metadata);
			let v = encodeURIComponent(encodedMetadata);
			// console.log(v);
			const tusOptions = {
				endpoint: `${endpoint}?metadata=${v}`,
				chunkSize,
				retryDelays: [0, 1000, 3000, 5000],
				parallelUploads,
				metadata,
				onUploadUrlAvailable() {
					job.url = job.tus.url;
				},
				onError(error) {
					console.log(error);
					reject(error);
				},
				onProgress(bytesUploaded, bytesTotal) {
					job.transmitPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
					job.bytesUploaded = bytesUploaded;
					job.bytesTotal = bytesTotal;
				},
				onSuccess(resp) {
					// let x = resp.lastResponse._xhr;
					// let msg = `上传成功`;
					// if (x.status === 208) {
					// 	msg = '文件已经在服务器上了';
					// }
					// console.log(`${metadata.filename} ${msg}(${x.status}): ${job.url}`);

					resolve(job);
				},
			};
      console.log(tusOptions);
			job.tus = new tus.Upload(job.file, tusOptions);
			job.tus.start();
		});
	}

	function reset() {
		clearSelectedFiles();
	}

  async function fetchExamInfo() {
        fetch(`/api/exam?exam_id=${examID}`,{
            method:"GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.json())
        .then((data) =>{
            if(data.status === 0)
            {
                const examData = data.data;
                console.log("examData",examData);
                exam_name = examData.examInfo.Name;
                exam_rules = examData.examInfo.Rules;
                exam_type = examData.examInfo.Type;
                exam_method = examData.examInfo.Mode;
                examinee_ID = examData.examinee || [];
                invigilator_ID = examData.invigilators || [];
                 
                uploadedFileList = examData.files || [];
                exam_rooms = (examData.examRooms || []).map(({roomID,...rest})=>({
                  id:roomID,
                  ...rest
                }));
                paper_configs = examData.examSessions.map((s, idx) => {
                const mappedConfig = {
                    paperID: s.PaperID || 0,
                    paperName:s.PaperName,
                    periodMode: "00",
                    startTime: s.StartTime ? new Date(s.StartTime).toISOString() : "",
                    endTime: s.EndTime ? new Date(s.EndTime).toISOString() : "",
                    duration: s.Duration || 0,
                    maxDuration: s.Duration || 0,
                    nameVisibility: s.NameVisibilityIn,
                    markMode: s.MarkMode || "10",
                    markMethod: s.MarkMethod || "00",
                    gradingConfig: [],
                    isHide: false,
                    sessionNum: s.SessionNum,
                    markConfig: {
                        teacher_mark_configs: [],
                    },
                    show_paper_selection_panel: false,
                    showGraderSelectionPanel: false,
                    lateEntryTime: s.LateEntryTime || 1,
                    earlySubmissionTime: s.EarlySubmissionTime || 0,
                    QuestionShuffledMode:s.QuestionShuffledMode
                };
                Reviewer_ID[idx] = Array.isArray(s.ReviewerIds) ? s.ReviewerIds : [];
                fetchSelectedReviewers(idx);
                return mappedConfig;
            });
              
          }
        })
        .catch((e) => {
            console.error("获取考试信息失败", e);
        })
        .finally(() =>{
          checkShuffledMode();
          fetchSelectedStudents();
          fetchSelectedInvigilators();

          
          loading=false;
          console.log(Reviewer_ID);
        })
    }
  
  async function fetchSelectedReviewers(index){
    console.log('idnex',Reviewer_ID);
    const query = encodeURIComponent(JSON.stringify({
    data: {
      Type:"00",
      UserIDs: Reviewer_ID[index], 
    },
  }));
    fetch(`/api/exam/user?q=${query}`,
      {
        method:"GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => response.json())
        .then((data)=>{
           paper_configs[index].markConfig.teacher_mark_configs = (data?.data || []).map((reviewer,index)=>{
              return{
                ID:reviewer.id,
                OfficialName:reviewer.name,
                MobilePhone:reviewer.mobile_phone,
                IDCardNo:reviewer.id_card_no,
                Gender:reviewer.gender
              }
           });
        })
  }

  async function fetchSelectedInvigilators(){
    const query = encodeURIComponent(JSON.stringify({
    data: {
      Type:"00",
      UserIDs: invigilator_ID, // 必须是数组，例如 [123, 456, 789]
    },
  }));
    fetch(`/api/exam/user?q=${query}`,
      {
        method:"GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => response.json())
        .then((data)=>{
           invigilators=(data?.data || []).map((invigilator,index)=>{
              return{
                ID:invigilator.id,
                OfficialName:invigilator.name,
                MobilePhone:invigilator.mobile_phone,
                IDCardNo:invigilator.id_card_no,
                Gender:invigilator.gender
              }
           });
        })
  }

  async function fetchSelectedStudents() {
     const query = encodeURIComponent(JSON.stringify({
    data: {
      Type:"02",
      // UserIDs: examinee_ID, // 必须是数组，例如 [123, 456, 789]
      Examinees:examinee_ID
    },
  }));
    fetch(`/api/exam/user?q=${query}`,
      {
        method:"GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => response.json())
        .then((data)=>{
           exam_examinee=(data?.data || []).map((examinee,index)=>{
              return{
                ID:examinee.id,
                OfficialName:examinee.name,
                MobilePhone:examinee.mobile_phone,
                IDCardNo:examinee.id_card_no,
                Gender:examinee.gender,
                exam_plan_student_id:examinee.exam_plan_student_id
              }
           });
        })
      }
  
    onMount(async()=>{
        page.subscribe(value => {
        examID = value.params.examID;
    });
         tus= await import('tus-js-client');
        tusInit();
        queryFiles();
        await fetchExamInfo();
    })


  function closeLoading() {
    loading = false; // 关闭加载状态
  }
</script>
{#if loading}
<div>
  
    <Loading bind:value={loading} loadingText="正在加载"></Loading>
</div>
{:else}
<Title title="创建考试" line={true} />
<div class="createExamWrapper">
  <div class="createExamContainer">
    <div class="examNameInputContainer">
      <RequiredLabel text="考试名称" />
      <input
        placeholder="请输入考试名称（例：xxx平时考试）"
        class="exam-name-input"
        bind:value={exam_name}
        maxlength={50}
      />
    </div>

    <div class="examRuleInputContainer">
      <RequiredLabel text="考试规则" />
      <div class="ruleInputContainer">
        <SmartEditor
          bind:this={RichTextEditor}
          width={'100%'}
          height={'400px'}
          editor_options={{
            ...EDITOR_OPTIONS,
            placeholder: '请输入考试规则',
            onContentChange: (
              /**
               * @type {PiptapEditor}
               */
              editor,
            ) => {
              exam_rules = editor.getPreviewHTML();
            },
          }}
        />
      </div>
    </div>

    <div class="examTypeChooseContainer">
      <RequiredLabel text="考试类型" />
      <div class="exam-choice-container">
        <label class="label">
          <input type="radio" bind:group={exam_type} value={'00'} class="choice-radio-input" />
          平时考试
        </label>
        <label class="label">
          <input type="radio" bind:group={exam_type} value={'02'} class="choice-radio-input" />
          期末成绩考试
          <span class="tip-wrapper">
            <img class="tip" alt="提示" src="/exam_list/tip.png" />
            <div class="tooltip-text">{TIP_TEXT['final_exam']}</div>
          </span>
        </label>
        <label class="label">
          <input type="radio" bind:group={exam_type} value={'04'} class="choice-radio-input"
          onchange={() => {
          exam_method = '02'; // 选择资格证考试时自动设置为线下
        }}
         />
          资格证考试
          <span class="tip-wrapper">
            <img class="tip" alt="提示" src="/exam_list/tip.png" />
            <div class="tooltip-text">
              {TIP_TEXT['qualifying_exams']}
            </div>
          </span>
        </label>
      </div>
    </div>

    <div class="exam-type-choose-container">
      <RequiredLabel text="考试方式" />
      <div class="exam-choice-container">
        <label class="label">
          <input
            type="radio"
            bind:group={exam_method}
            value={'00'}
            class="choice-radio-input"
            disabled={exam_type === '04'}
          />
          线上考试
          <span class="tip-wrapper">
            <img class="tip" alt="提示" src="/exam_list/tip.png" />
            <div class="tooltip-text">{TIP_TEXT['online']}</div>
          </span>
        </label>
        <label class="label">
          <input type="radio" bind:group={exam_method} value={'02'} class="choice-radio-input" />
          线下机房考试
          <span class="tip-wrapper">
            <img src="/exam_list/tip.png" alt="提示" style="width: 14px; height:auto" />
            <div class="tooltip-text">{TIP_TEXT['offline']}</div>
          </span>
        </label>
      </div>
    </div>


    <div class="paper-configs-container">
      <RequiredLabel text="配置试卷" />
      <div class="paper-configs">
        {#each paper_configs as _, index}
          <div></div>
          <!-- 左侧占位，与标签对齐 -->
          {@render paperConfig(index)}
        {/each}

        <Button
          plain={true}
          size="small"
          onclick={() => {
            addNewPaper();
          }}>添加试卷</Button
        >
      </div>
    </div>

    <div class="total-duration-container">
      <RequiredLabel text="总考试时长" />
      <div class="total-duration-input-container">
        <span class="total-duration-text">{total_duration}</span>
        <span class="total-duration-text">&nbsp;&nbsp;&nbsp;分钟</span>
      </div>
    </div>

     <div class="examination-room-container {exam_method === '02' ? '' : 'hideButton'}">
      <RequiredLabel text="考场配置" colon={false} Asterisk={false} />
      <div class="examination-room-button-container normal-button-container">
        <Button
          plain={true}
          type="primary"
          size="small"
          onclick={()=>{
            show_rooms_panel=true;
          }}
          >
          考场选择
        </Button>
        <div class="room-number-container">
          <span class="examinee-number-text">已选择</span>
          <span>{exam_rooms.length}</span>
          <span>个考场，总容量为 {total_capacity} 名考生</span>
        </div>
      </div>
    </div>

    <div class="examinee-container">
      <RequiredLabel text="考试人员" colon={false} Asterisk={false} />
      <div class="examinee-button-container normal-button-container">
        <Button
          plain={true}
          type="primary"
          size="small"
          onclick={() => {
            show_examinee_panel = true;
          }}
        >
          考生选择
        </Button>

        <div class="examinee-number-container">
          <span class="examinee-number-text">已选择 </span>
          <span class="examinee-number-text {exam_examinee.length === 0 && exam_method === '02'}"
            >{exam_examinee.length}</span
          >
          <span class="examinee-number-text"> 名</span>
        </div>
      </div>
    </div>

    <div class="invigilator-container {exam_method === '02' ? '' : 'hideButton'}">
      <RequiredLabel text="监考员" colon={false} Asterisk={false} />
      <div class="examinee-button-container normal-button-container">
        <Button
          plain={true}
          type="primary"
          size="small"
          onclick={() => {
            show_invigilator_panel = true;
          }}
        >
          配置监考员
        </Button>

        <div class="invigilator-number-container">
          <span class="examinee-number-text">已选择 </span>
          <span class="examinee-number-text {invigilators.length === 0 && exam_method === '02'}"
            >{invigilators.length}</span
          >
          <span class="examinee-number-text"> 名</span>
        </div>
      </div>
    </div>

    <div class = "file-container">
      <RequiredLabel text="考试说明" colon={false} Asterisk={false} />
      <div class = "file-button-container">

        <label class="file-upload-label">
          <Button
            plain={true}
            type="primary"
            size="small"
          >
            上传文件
          </Button>
          <input
            class="file-input-hidden"
            type="file"
            multiple
            bind:files={selectedFiles}
            onchange={() => uploadFiles()}
          />
      </label>

      
    </div>

       </div>
       
       <div class="fileListContainer {uploadedFileList.length===0 ? 'hideButton' :' '}">
      <RequiredLabel text="附件列表" Asterisk={false} colon = {false}></RequiredLabel>
          <div class="file-list-wrapper">
              <ul class="file-list">
                {#each uploadedFileList as file, idx (file.checksum)}
                  <li class="file-item">
                    <div class="file-info">
                      <span class="file-name" title={file.name}>{file.name}</span>
                    </div>
                    <Button plain={true}  type="danger" size="medium" onclick={() => deleteFiles(file)}>删除</Button>
                  </li>
                {/each}
              </ul>
          </div>
      </div>

    <div class="bottom-action-panel-fixed">
      <button
        class="cancel-action-button"
        onclick={() => {
          goto('/teacher/exam');
        }}>取消</button
      >
      <button
        class="save-action-button"
        onclick={() => {
          handleSubmit({
            examID,
            exam_name,
            exam_rules,
            exam_type,
            exam_method,
            paper_configs,
            exam_examinee,
            invigilators,
            uploadedFileList,
            exam_rooms,
          });
        }}>保存</button
      >
    </div>
  </div>
</div>
{/if}

{#snippet paperConfig(/** @type {number} */ paperConfigIndex)}
  <div class="paper-config-container">
    <div class="paper-config-head">
      <span class="paper-num">试卷{paperConfigIndex + 1}</span>
      <button
        class='delete-paper-button'
        onclick={() => {
          paper_configs.splice(paperConfigIndex, 1);
          // 清空考场选择
          exam_rooms = [];
          invigilators = [];
        }}><img src="/exam_list/delete.svg" alt="删除" /></button
      >
      <button
        class="arrow"
        onclick={() => {
          paper_configs[paperConfigIndex].isHide = !paper_configs[paperConfigIndex].isHide;
        }}><img src="/dropdown/arrow_black.png" alt="展开/收起" /></button
      >
    </div>

    <div class="paper-config-body {paper_configs[paperConfigIndex].isHide ? 'hide' : 'show'}">
      <div class="paper-choose-container config-row">
        <RequiredLabel text="试卷" />
        <div class="config-row-content">
          <div class="paper-button-container normal-button-container">
            {#if paper_configs[paperConfigIndex].paperID === 0}
              <Button
                plain={true}
                size="small"
                type="primary"
                onclick={() => {
                  paper_configs[paperConfigIndex].show_paper_selection_panel = true;
                }}
              >
                试卷选择
              </Button>
            {:else}
              <div class="paper-item-container">
                <!-- {#if !paper_configs[paperConfigIndex].paperType || !paper_configs[paperConfigIndex].paperName}
                  <span class="paper-type-text">未知试卷</span>
                {:else}
                  <span class="paper-type-text">
                    {ASSEMBLY_TYPE_MAP[paper_configs[paperConfigIndex].paperType]}：
                  </span>

                  <span class="paper-name-text">{paper_configs[paperConfigIndex].paperName}</span>
                {/if} -->
                <span class="paper-type-text">
                  自定义组卷：
                </span>
                <span class="paper-name-text">{paper_configs[paperConfigIndex].paperName}</span>

                <button
                  class="edit-button"
                  onclick={() => {
                    paper_configs[paperConfigIndex].show_paper_selection_panel = true;
                  }}
                >
                  编辑
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="exam-mode-container config-row">
        <RequiredLabel text="考试时段模式" />
         <div class="config-row-content">
          <label class="label">

            <input
              type="radio"
              checked={paper_configs[paperConfigIndex].periodMode === '00'}
              value={'00'}
              class="choice-radio-input"
              onchange={() => {
              if (paper_configs[paperConfigIndex].periodMode !== '00') {
                 paper_configs[paperConfigIndex].periodMode = '00';
                 resetTime(paperConfigIndex);
              }
            }}
            />
            固定时段考试

            <span class="tip-wrapper">
              <img class="tip" alt="提示" src="/exam_list/tip.png" />
              <div class="tooltip-text" style="min-width: 255px;">
                {TIP_TEXT['fixed']}
              </div>
            </span>
          </label>

          <label class="label">
          <input
              type="radio"
              checked={paper_configs[paperConfigIndex].periodMode === '02'}
              value={'02'}
              class="choice-radio-input"
               onchange={() => {
              if (paper_configs[paperConfigIndex].periodMode !== '02') {
                  paper_configs[paperConfigIndex].periodMode = '02';
                  resetTime(paperConfigIndex);
              }
            }}
            />
            灵活时段考试
          </label>
        </div>
      </div>

      <div class="exam-time-container config-row">
        <RequiredLabel text="考试时段" />
        <div class="config-row-content">
          <DatePicker
            is_time_selection={true}
            input_width={'350px'}
            is_single_date_selection={false}
            on:start_date_selected={onChooseStartTime(paperConfigIndex,paper_configs, updateDuration)}
            on:end_date_selected={onChooseEndTime(paperConfigIndex,paper_configs, updateDuration)}
            initial_start_date={paper_configs[paperConfigIndex].startTime ? new Date(paper_configs[paperConfigIndex].startTime) : null}
            initial_end_date={paper_configs[paperConfigIndex].endTime ? new Date(paper_configs[paperConfigIndex].endTime) : null}
            onDateConfirm={()=>[
              updateDuration(paperConfigIndex,paper_configs)
            ]}
          ></DatePicker>
        </div>
      </div>

      <div class="exam-duration-container config-row">
        <RequiredLabel text="考试时长" />
        <div class="config-row-content">
          <input
            class="{paper_configs[paperConfigIndex].periodMode==='00'?"duration-input":'simple-input'}"
            bind:value={paper_configs[paperConfigIndex].duration}
            type="number"
            min="1"
          />
          <span style="font-size: 14px;">分钟</span>
        </div>
      </div>

      <div class="exam-duration-container config-row {paper_configs[paperConfigIndex].periodMode === '02' || exam_method === '02' ? 'hideButton'  : ''}">
        <RequiredLabel text="考场规则" />

        <div class="config-row-content">
          <span style="font-size: 14px;">考试开始后</span>

          <input
            class="simple-input"
            type='number'
            bind:value={paper_configs[paperConfigIndex].lateEntryTime}
            min='0'
            max={paper_configs[paperConfigIndex].duration}
            oninput={(event) => {
              const max = paper_configs[paperConfigIndex].duration;
              const val = Number(event.target.value);
              if (val > max) {
                event.target.value = max;
                paper_configs[paperConfigIndex].lateEntryTime = max;
              } else if (val < 1) {
                event.target.value = 1;
                paper_configs[paperConfigIndex].lateEntryTime = 1;
              }
            }}  
          />

          <span style="font-size: 14px;">分钟内可进入考场，可提前</span>
            
          <input
            class="simple-input"
            type='number'
            bind:value={paper_configs[paperConfigIndex].earlySubmissionTime}
            min='0'
            max={paper_configs[paperConfigIndex].duration}
            oninput={(event) => {
              const max = paper_configs[paperConfigIndex].duration;
              const val = Number(event.target.value);
              if (val > max) {
                event.target.value = max;
                paper_configs[paperConfigIndex].earlySubmissionTime = max;
              } 
            }}  
          />

          <span style="font-size: 14px;">分钟交卷</span>
        </div>
      </div>

      <div class="order-manner-container config-row">
        <RequiredLabel text="乱序方式" />
        <div class="config-row-content">
          <label class="label">
            <input
              type="checkbox"
              class="choice-radio-input"
              bind:checked={paper_configs[paperConfigIndex].isOptionShuffled}
            />
            选项乱序
          </label>
          <label class="label">
            <input
              type="checkbox"
              class="choice-radio-input"
              bind:checked={paper_configs[paperConfigIndex].isQuestionShuffled}
            />
            试题乱序
          </label>
        </div>
      </div>

      <div class="marking-method-container config-row">
        <RequiredLabel text="批卷方式" />
        <div class="config-row-content">
          <label class="label">
            <input
              type="radio"
              bind:group={paper_configs[paperConfigIndex].markMethod}
              value={'00'}
              class="choice-radio-input"
            />
            人工批卷
          </label>

          <label class="label">
            <input
              type="radio"
              bind:group={paper_configs[paperConfigIndex].markMethod}
              value={'02'}
              class="choice-radio-input"
            />
            自动批卷
          </label>
        </div>
      </div>

      <div class="show-name-container {paper_configs[paperConfigIndex].markMethod !== '00' ? 'hide' : 'config-row'}">
        <RequiredLabel text="批改时是否显示考生姓名" Asterisk={false} colon={true} />

        <div class="config-row-content">
          <label class="label">
            <input
              type="radio"
              bind:group={paper_configs[paperConfigIndex].nameVisibility}
              value={true}
              class="choice-radio-input"
            />
            是
          </label>
          <label class="label">
            <input
              type="radio"
              bind:group={paper_configs[paperConfigIndex].nameVisibility}
              value={false}
              class="choice-radio-input"
            />
            否
          </label>
        </div>
      </div>


     <div class="correct-setting-container {paper_configs[paperConfigIndex].markMethod == "02" ? 'hide' : 'config-row'}">
          <RequiredLabel text="批改配置" Asterisk={false} colon={true} />
          <button class="btn btn--info btn--small is-plain" 
          onclick={()=>{
            paper_configs[paperConfigIndex].show_reviewer_panel = true;
          }}>
            添加批阅员
          </button>
          <span style="font-size:14px;margin-top:2px;">已选择 {paper_configs[paperConfigIndex].markConfig.teacher_mark_configs.length} 名</span>
        </div>

        <div class="grading-mode-container {paper_configs[paperConfigIndex].markMethod !== '00' ? 'hide' : ' config-row'}">
          <RequiredLabel text="批改模式" />
          <div class="config-row-content {paper_configs[paperConfigIndex].markConfig.teacher_mark_configs.length>=2 ? 'hide' : 'markConfig'}">
            <label class="label" style="color: #757575;">
              <input
                type="radio"
                bind:group={paper_configs[paperConfigIndex].markMode}
                value={'10'}
                class="choice-radio-input"
              />
              单人批改
            </label>
          </div>

          <div class = "config-row-content {paper_configs[paperConfigIndex].markConfig.teacher_mark_configs.length>=2 ? 'markConfig' : 'hide'}">
              <span>多人阅卷：</span>
            <label class="label " style="color: #757575;">            
            <input
                type="radio"
                bind:group={paper_configs[paperConfigIndex].markMode}
                value={'02'}
                class="choice-radio-input"
              />
              全卷多评
              <span class="tip-wrapper">
                <img class="tip" alt="提示" src="/exam_list/tip.png" />
                <div class="tooltip-text" style="min-width: 255px;">
                  {TIP_TEXT['multiply_mark']}
                </div>
              </span>
            </label>
            
            <label class="label " style="color: #757575;">            
            <input
                type="radio"
                bind:group={paper_configs[paperConfigIndex].markMode}
                value={'04'}
                class="choice-radio-input"
              />
              试卷分配
              <span class="tip-wrapper">
                <img class="tip" alt="提示" src="/exam_list/tip.png" />
                <div class="tooltip-text" style="min-width: 255px;">
                  {TIP_TEXT['assignment_of_paper']}
                </div>
              </span>
            </label>

            <label class="label " style="color: #757575;">            
            <input
                type="radio"
                bind:group={paper_configs[paperConfigIndex].markMode}
                value={'06'}
                class="choice-radio-input"
              />
              按题分配
              <span class="tip-wrapper">
                <img class="tip" alt="提示" src="/exam_list/tip.png" />
                <div class="tooltip-text" style="min-width: 255px;">
                  {TIP_TEXT['question_group_mark']}
                </div>
              </span>
            </label>

          </div>

        </div>
      </div>

    <PaperSelectionPanel
      selected_id={paper_configs[paperConfigIndex].paperID}
      selected_name={paper_configs[paperConfigIndex].paperName}
      selected_type={paper_configs[paperConfigIndex].paperType}
      show_panel={paper_configs[paperConfigIndex].show_paper_selection_panel}
      excludedPaperIDs={getSelectedPaperIDs(paperConfigIndex)}
      onCancel={() => {
        paper_configs[paperConfigIndex].show_paper_selection_panel = false;
      }}
      onConfirm={(
        /** @type {number} */ selected_id,
        /** @type {string} */ selected_name,
        /** @type {string} */ selected_type,
      ) => {
        paper_configs[paperConfigIndex].show_paper_selection_panel = false;
        paper_configs[paperConfigIndex].paperID = selected_id;
        paper_configs[paperConfigIndex].paperName = selected_name;
        paper_configs[paperConfigIndex].paperType = selected_type;
      }}
    ></PaperSelectionPanel>

    <ReviewerSelectionPanel
        show_panel = {paper_configs[paperConfigIndex].show_reviewer_panel}
        onConfirm={(selected) =>{
            paper_configs[paperConfigIndex].show_reviewer_panel=false;
            paper_configs[paperConfigIndex].markConfig.teacher_mark_configs=selected;
            if(paper_configs[paperConfigIndex].markConfig.teacher_mark_configs.length>=2)
            {
              paper_configs[paperConfigIndex].markMode = '02';
            }
            else{
              paper_configs[paperConfigIndex].markMode = '10'
            }
          }}
        onCancel={()=>{
            paper_configs[paperConfigIndex].show_reviewer_panel=false;
          }}
        selectedReviewers={paper_configs[paperConfigIndex].markConfig.teacher_mark_configs}
        ></ReviewerSelectionPanel>

    <ExamineeSelectionPanel
      show_panel={show_examinee_panel}
      onConfirm={(selected) => {
        //确认后将选择的考生取出
        show_examinee_panel = false;
        exam_examinee = selected;
      }}
      onCancel={(/** @type {boolean} */ load_new_file) => {
        show_examinee_panel = false;
        if (load_new_file) {
          exam_examinee = [];
        }
      }}
      ids={exam_examinee}
    ></ExamineeSelectionPanel>

    <ExaminationRoomSelectionPanel
        show_panel = {show_rooms_panel}
        onConfirm={(selected) =>{
          show_rooms_panel=false;
          exam_rooms=selected;
        }}
        onCancel={()=>{
          show_rooms_panel=false;
        }}
        exam_start_time = {start_time}
        exam_end_time = {end_time}
        selectedRooms = {exam_rooms}
    ></ExaminationRoomSelectionPanel>

    <InvigilatorSelectionPanel
      show_panel={show_invigilator_panel}
      onConfirm={(selected) => {
        show_invigilator_panel = false;
        invigilators = selected;
      }}
      onCancel={() => {
        show_invigilator_panel = false;
      }}
      selectedInvigilators={invigilators}
    ></InvigilatorSelectionPanel>

  </div>
{/snippet}

<style lang="scss" scoped>
  .hide {
    display: none;
  }
  .createExamWrapper {
    position: relative;
    display: block;
    background: #fff;
    // margin: 0 auto;
    overflow-y: auto;
    overflow-x: auto;
    padding-bottom: 5%;
    padding-top: 10px;
    margin-bottom: 4%;
    box-sizing: border-box;
    .createExamContainer {
      width: 90%;
      margin: 0 auto;
      position: relative;
      background-color: white;
      display: grid;
      gap: 20px; //垂直间距
      align-items: center;
      // overflow-y: auto;
      overflow-x: auto;
      .examNameInputContainer,
      .examRuleInputContainer,
      .examTypeChooseContainer,
      .exam-type-choose-container,
      .total-duration-container,
      .examination-room-container,
      .examinee-container,
      .invigilator-container,
      .file-container {
        display: grid;
        grid-template-columns: auto 1fr;
        // margin-left:15%;
        gap: 20px;
        // align-items: center;
      }
    }
  }

  .fileListContainer,
  .paper-configs-container{
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    align-items: start;
   }

  .exam-name-input {
    //max-width:60%;
    min-height: 32px;
    box-sizing: border-box;
    border: 1px solid #d7d7d7;
    border-radius: 2px;
    outline: none; //选中时不出现黑色轮廓线
    font-size: 14px;
  }

  .paper-config-container {
    position: relative;
    // width: 60%;
    margin-bottom: 10px;
    .paper-config-head {
      height: 40px;
      background-color: #dcdcdc;
      display: flex;
      align-items: center;
      justify-content: center;
      .paper-num {
        margin: auto;
      }
      .arrow {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        cursor: pointer;
      }
      .delete-paper-button {
        position: absolute;
        top: 10px;
        right: 50px;
        width: 15px;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        cursor: pointer;
      }
    }
    .paper-config-body {
      background-color: #f2f2f2;
      padding-top: 10px;
      padding-left: 5%; //配置试卷区域的左边距

      .paper-button-container {
        display: flex;
        flex-direction: row;
        .paper-item-container {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          background-color: #dcdcdc;
          border-radius: 20px;
          min-height: 33px;
          padding: 0 10px 0 10px;
          margin-left: 5px;

          .paper-type-text {
            color: var(--primary-active);
            font-size: 14px;
          }
          .paper-name-text {
            color: black;
            font-size: 14px;
            max-width: 350px;
            word-wrap: break-word;
          }
        }
      }
    }
  }

  .tip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    .tip {
      width: 14px;
      height: auto;
    }
    .tooltip-text {
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      position: absolute;
      bottom: 150%;
      left: 50%;
      transform: translateX(-50%);
      white-space: pre-line;
      background-color: white;
      border: 1px solid #d7d7d7;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 14px;
      line-height: 1.4;
      z-index: 1;
      max-width: 200px;
      min-width: 120px;
    }

    &:hover .tooltip-text {
      visibility: visible;
      opacity: 1;
    }
  }

  .paper-choose-container.config-row,
  .exam-mode-container.config-row,
  .exam-time-container.config-row,
  .exam-duration-container.config-row,
  .order-manner-container.config-row,
  .grading-mode-container.config-row,
  .correct-setting-container,
  .grading-config-container.config-row,
  .show-name-container.config-row,
  .marking-method-container.config-row,
  .grading-mode-button-container,
  .examinee-button-container.normal-button-container,
  .examination-room-button-container.normal-button-container,
  .invigilator-number-container {
    display: flex;
    flex-wrap: nowrap;
    margin-top: 10px;
    padding-bottom: 10px;
    gap: 10px;
    .duration-input {
      height: 20px;
      width: 60px;
      pointer-events: none;
      opacity: 0.5; /* 灰色显示 */
    }
  }

  .total-duration-text {
    font-size: 14px;
    color: #333;
  }

  .examinee-number-text {
    font-size: 14px;
  }

  .config-row-content {
    font-size: 14px;
    &.markConfig{
        margin-top: 3px;
      }
  }
  .bottom-action-panel-fixed {
    display: flex;
    position: fixed;
    gap: 20%;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    background-color: #fff;
    padding: 15px 20px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #eee;
    z-index: 100;
    .cancel-action-button {
      width: 100px;
      height: 32px;
      background-color: white;
      border: 1px solid #dcdcdc;
      border-radius: 3px;
      font-size: 14px;
      // color: var(--text-primary);//
      cursor: pointer;
    }
    .save-action-button {
      border: none;
      background-color: blue;
      height: 32px;
      width: 100px;
      border-radius: 3px;
      color: white;
      cursor: pointer;
    }
    .save-action-button:hover {
      background-color: blue; //
    }
    .cancel-action-button:hover {
      border: 1px solid #0336ff;
      color: #3083ff;
    }
  }

  .edit-button {
    border: none;
    background-color: rgb(0, 0, 0, 0);
    cursor: pointer;
    color: var(--primary-color);
    font-size: 14px;
    margin: 0 5px;
  }
  .edit-button:hover {
    text-decoration: underline;
  }

  .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }

  .simple-input {
    border-radius: 3px;
    height: 26px;
    width:70px;
    padding: 0 8px;
    background-color: #fff;
    border: 1px solid #ccc;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
    transition: border 0.2s;
    
    &:hover,
    &:focus {
      border-color: #409eff;
    }
    
    &.disabled {
      cursor: not-allowed;
      background-color: #f5f5f5;
      color: #c0c4cc;
    }
  }

  .examinee-number-container,
  .room-number-container {
    font-size: 14px;
    padding-top:4px;
  }

  .file-button{
    color:var(--blue);
  }

  .file-upload-label {
  display: inline-block;
  position: relative;
  cursor: pointer;
}

.file-input-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-list-wrapper {
    margin-top: 8px;
    max-width: 360px;
  }

  .file-empty-tip {
    color: #999;
    font-size: 14px;
  }

  .file-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--bg-primary);
    border: 1px solid var(--blue);
    border-radius: 6px;
    transition: background 0.2s;
    max-width: 250px;
  }

  .file-item:hover {
    background: var(--bg-primary);
  }

  .file-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .file-name {
    font-size: 14px;
    color: var(--blue);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-size {
    font-size: 12px;
    color: #656d76;
  }

  .file-del {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 2px;
    line-height: 0;
  }

  .file-del img {
    width: 14px;
    height: 14px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .file-del:hover img {
    opacity: 1;
  }

  .choice-radio-input {
  vertical-align: middle;   /*垂直居中 */
  margin-bottom: 6px;
}
</style>
