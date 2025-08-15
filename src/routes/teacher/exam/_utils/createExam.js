import { toast } from '$lib/components/Toast/Toast.js';
import {goto } from '$app/navigation';
export function onChooseStartTime(index, paper_configs, updateDuration) {
  return function (event) {
    const startDate = event.detail.date;
    if (startDate) {
      startDate.setSeconds(0, 0);
      paper_configs[index].startTime = startDate.toISOString();
      updateDuration(index,paper_configs);
    }
  };
}

export function onChooseEndTime(index, paper_configs, updateDuration) {
  return function (event) {
    const endDate = event.detail.date;
    if (endDate) {
      endDate.setSeconds(0, 0);
      paper_configs[index].endTime = endDate.toISOString();
      updateDuration(index,paper_configs);
    }
  };
}

export function updateDuration(index,paper_configs) {
    const startTime = paper_configs[index].startTime;
    const endTime = paper_configs[index].endTime;

    if (!startTime || !endTime) {
      paper_configs[index].duration = 0;
      paper_configs[index].maxDuration = 0;
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeDifference = end.getTime() - start.getTime();
    const durationInMinutes = Math.floor(timeDifference / (1000 * 60));

    paper_configs[index].duration = Math.max(0, durationInMinutes);
    paper_configs[index].maxDuration = Math.max(0, durationInMinutes);
  }

export async function handleSubmit({ exam_name, exam_rules, exam_type, exam_method, paper_configs, exam_examinee = [], invigilators = [] }) {
    /* 1. 必填字段校验（保持原逻辑） */
    if (exam_name === '') {
      toast.warning('请输入考试名称');
      return;
    }
    if (exam_name.length > 50) {
      toast.warning('考试名称不得超过五十个字符');
      return;
    }
    if (exam_rules === '') {
      toast.warning('请输入考试规则');
      return;
    }
    if (exam_rules.length > 1000) {
      toast.warning('考试规则不得超过1000个字符');
      return;
    }

    for (let i = 0; i < paper_configs.length; i++) {
      if (paper_configs[i].paperID === 0) {
        toast.warning(`第${i + 1}个场次未选择试卷`);
        return;
      }
    }
    /* 2. 场次级校验（保持原逻辑） */
    for (let i = 0; i < paper_configs.length; i++) {
      const session = paper_configs[i];

      if (!session.startTime || session.startTime === '') {
        toast.warning(`第${i + 1}个场次未设置时间段`);
        return;
      }
      if (!session.endTime || session.endTime === '') {
        toast.warning(`第${i + 1}个场次未设置时间段`);
        return;
      }

      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const now = new Date();

      if (startTime < now) {
        toast.warning(`第${i + 1}个场次的开始时间不能早于当前时间`);
        return;
      }
      if (endTime <= startTime) {
        toast.warning(`第${i + 1}个场次的结束时间必须晚于开始时间`);
        return;
      }
    }
    
    /* 3. 预处理场次数据（保持原逻辑） */
    for (let i = 0; i < paper_configs.length; i++) {
      paper_configs[i].sessionNum = i + 1;

      if (paper_configs[i].isOptionShuffled && paper_configs[i].isQuestionShuffled) {
        paper_configs[i].questionShuffledMode = '00';
      } else if (paper_configs[i].isOptionShuffled && !paper_configs[i].isQuestionShuffled) {
        paper_configs[i].questionShuffledMode = '02';
      } else if (!paper_configs[i].isOptionShuffled && paper_configs[i].isQuestionShuffled) {
        paper_configs[i].questionShuffledMode = '04';
      } else {
        paper_configs[i].questionShuffledMode = '06';
      }

      if (paper_configs[i].markMethod === '02') {
        paper_configs[i].markConfig.teacher_mark_configs = [];
        paper_configs[i].markMode = '00';
      }

      paper_configs[i].lateEntryTime = paper_configs[i].lateEntryTime <= 0 ? 1 : paper_configs[i].lateEntryTime;
      paper_configs[i].earlySubmissionTime =
        paper_configs[i].earlySubmissionTime <= 0 ? 0 : paper_configs[i].earlySubmissionTime;
    }
    
    
    const examSessionsdata = paper_configs.map((cfg) => ({
      PaperID: cfg.paperID,
      // PaperID:              61,
      PeriodMode: cfg.periodMode,
      StartTime:  new Date(cfg.startTime).getTime() ,
      EndTime:  new Date(cfg.endTime).getTime() ,
      Duration: Number(cfg.duration) ,
      LateEntryTime: Number(cfg.lateEntryTime) ,
      EarlySubmissionTime: Number(cfg.earlySubmissionTime) || 0,
      QuestionShuffledMode: cfg.questionShuffledMode,
      MarkMethod: cfg.markMethod,
      NameVisibilityIn: !!cfg.nameVisibility,
      ReviewerIds:
        cfg.markConfig && cfg.markConfig.teacher_mark_configs ? cfg.markConfig.teacher_mark_configs.map((t) => t.id) : [],
      MarkMode: cfg.markMode,
      SessionNum: cfg.sessionNum,
    }));

    // 附加文件：若用户上传了文件，则遍历填充；否则留空数组
    // const fileArr = files.length ? files.map((f) => ({ Name: f.name, Url: f.url || '' })) : [];
    console.log("paper",paper_configs);
    const exam_data = {
      data: {
        examInfo: {
          Name: exam_name,
          Rules: exam_rules,
          Type: exam_type,
          Mode: exam_method,
          Files:[]
          // Files: fileArr,
        },
        examSessions: examSessionsdata,
        examinee: exam_examinee.map((e) => e.id ), // 用户选中的考生 id 数组
        invigilators: invigilators.map((i) => i.id), // 监考员 id 数组
      },
    };

    console.log('exam_data', exam_data);
    console.log('paperconfig',paper_configs);
    fetch('/api/exam', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam_data),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log("所有检验通过");
        if (result.status === 0) {
          
          goto('/teacher/exam');
        } else {
          console.log("所有检验通过");
          toast.warning('用户没有创建考试的权限');
        }
      })
      .catch((error) => {
        toast.error('未知错误');
      });
  }