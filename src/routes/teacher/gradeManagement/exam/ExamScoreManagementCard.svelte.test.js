// @ts-nocheck
import { expect, test } from 'vitest';
import { afterAll, afterEach, beforeAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../../../../../node_modules/msw/lib/node/index'
import ExamScoreManagementCard from './ExamScoreManagementCard.svelte'
import { mount, unmount } from 'svelte';
import { waitFor } from '@testing-library/svelte';


const mock_data = [
    {
        "id": 1,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 89,
                "paper_name": "休国平",
                "start_time": 1772073395303,
                "end_time": 1764368455252,
                "total_score": 81,
                "average_score": 53,
                "scheduled_examinees": 10,
                "actual_examinees": 83,
                "pass_examinees": 2
            },
            {
                "id": 56,
                "paper_name": "蒋梓浩",
                "start_time": 1763151321703,
                "end_time": 1766300596034,
                "total_score": 57,
                "average_score": 65,
                "scheduled_examinees": 79,
                "actual_examinees": 78,
                "pass_examinees": 53
            }
        ],
        "submitted": false
    },
    {
        "id": 2,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 89,
                "paper_name": "裔芳",
                "start_time": 1775343409185,
                "end_time": 1733161930309,
                "total_score": 42,
                "average_score": 35,
                "scheduled_examinees": 65,
                "actual_examinees": 71,
                "pass_examinees": 37
            },
            {
                "id": 59,
                "paper_name": "华雅婷",
                "start_time": 1743814505267,
                "end_time": 1753562876446,
                "total_score": 11,
                "average_score": 7,
                "scheduled_examinees": 50,
                "actual_examinees": 32,
                "pass_examinees": 32
            }
        ],
        "submitted": false
    },
    {
        "id": 3,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 88,
                "paper_name": "劳杰",
                "start_time": 1719989515148,
                "end_time": 1728973269588,
                "total_score": 99,
                "average_score": 45,
                "scheduled_examinees": 83,
                "actual_examinees": 99,
                "pass_examinees": 67
            }
        ],
        "submitted": false
    },
    {
        "id": 4,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 22,
                "paper_name": "文艺涵",
                "start_time": 1725352979300,
                "end_time": 1724493061836,
                "total_score": 76,
                "average_score": 33,
                "scheduled_examinees": 74,
                "actual_examinees": 15,
                "pass_examinees": 72
            },
            {
                "id": 58,
                "paper_name": "户明",
                "start_time": 1727624535991,
                "end_time": 1724926863266,
                "total_score": 14,
                "average_score": 27,
                "scheduled_examinees": 76,
                "actual_examinees": 70,
                "pass_examinees": 20
            },
            {
                "id": 34,
                "paper_name": "悉文韬",
                "start_time": 1738452677078,
                "end_time": 1776322265668,
                "total_score": 100,
                "average_score": 72,
                "scheduled_examinees": 63,
                "actual_examinees": 34,
                "pass_examinees": 78
            }
        ],
        "submitted": false
    },
    {
        "id": 5,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 10,
                "paper_name": "束开慧",
                "start_time": 1767902430393,
                "end_time": 1733189813469,
                "total_score": 13,
                "average_score": 9,
                "scheduled_examinees": 23,
                "actual_examinees": 14,
                "pass_examinees": 53
            },
            {
                "id": 79,
                "paper_name": "宗政一全",
                "start_time": 1720828443277,
                "end_time": 1756335652644,
                "total_score": 25,
                "average_score": 57,
                "scheduled_examinees": 66,
                "actual_examinees": 15,
                "pass_examinees": 63
            },
            {
                "id": 30,
                "paper_name": "抄帅",
                "start_time": 1732180347224,
                "end_time": 1747446823014,
                "total_score": 37,
                "average_score": 62,
                "scheduled_examinees": 3,
                "actual_examinees": 2,
                "pass_examinees": 10
            }
        ],
        "submitted": false
    },
    {
        "id": 6,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 84,
                "paper_name": "万俟茗泽",
                "start_time": 1762271846126,
                "end_time": 1716493016988,
                "total_score": 98,
                "average_score": 72,
                "scheduled_examinees": 30,
                "actual_examinees": 27,
                "pass_examinees": 81
            },
            {
                "id": 83,
                "paper_name": "杨雨桐",
                "start_time": 1758916478719,
                "end_time": 1729868424616,
                "total_score": 17,
                "average_score": 58,
                "scheduled_examinees": 26,
                "actual_examinees": 28,
                "pass_examinees": 32
            },
            {
                "id": 42,
                "paper_name": "邓国荣",
                "start_time": 1723656418946,
                "end_time": 1718856640692,
                "total_score": 94,
                "average_score": 29,
                "scheduled_examinees": 27,
                "actual_examinees": 2,
                "pass_examinees": 79
            }
        ],
        "submitted": false
    },
    {
        "id": 7,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 48,
                "paper_name": "本梓萱",
                "start_time": 1770165095678,
                "end_time": 1744894002370,
                "total_score": 8,
                "average_score": 68,
                "scheduled_examinees": 80,
                "actual_examinees": 28,
                "pass_examinees": 16
            },
            {
                "id": 42,
                "paper_name": "闾沐阳",
                "start_time": 1761440486615,
                "end_time": 1753428738871,
                "total_score": 47,
                "average_score": 9,
                "scheduled_examinees": 5,
                "actual_examinees": 96,
                "pass_examinees": 26
            }
        ],
        "submitted": false
    },
    {
        "id": 8,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 65,
                "paper_name": "毛浩宇",
                "start_time": 1747523469305,
                "end_time": 1755384406391,
                "total_score": 74,
                "average_score": 84,
                "scheduled_examinees": 98,
                "actual_examinees": 75,
                "pass_examinees": 73
            }
        ],
        "submitted": false
    },
    {
        "id": 9,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 65,
                "paper_name": "步强",
                "start_time": 1771678723357,
                "end_time": 1776729355930,
                "total_score": 17,
                "average_score": 34,
                "scheduled_examinees": 40,
                "actual_examinees": 49,
                "pass_examinees": 42
            },
            {
                "id": 12,
                "paper_name": "边艳",
                "start_time": 1754590470757,
                "end_time": 1759121680241,
                "total_score": 48,
                "average_score": 37,
                "scheduled_examinees": 54,
                "actual_examinees": 82,
                "pass_examinees": 44
            }
        ],
        "submitted": false
    },
    {
        "id": 10,
        "name": "svelte基础考试",
        "type": "线上考试",
        "class": "svelte入门班",
        "sessions": [
            {
                "id": 65,
                "paper_name": "步强",
                "start_time": 1771678723357,
                "end_time": 1776729355930,
                "total_score": 17,
                "average_score": 34,
                "scheduled_examinees": 40,
                "actual_examinees": 49,
                "pass_examinees": 42
            }
        ],
        "submitted": false
    }
]



const server = setupServer(
    http.get('/api/teacher/exam-grade', (re) => {

        let url = re.request.url;

        // 解析url，获取查询参数
        let params = new URLSearchParams(url);

        let course_id = Number(params.get('courseID')) ?? 0;

        let class_id = Number(params.get('classID')) ?? 0;

        let page = Number(params.get('page'));

        let page_size = Number(params.get('pageSize'));

        let exam_type = params.get('type') ?? "";

        let submitted = Boolean(params.get('submitted')) ?? "";

        let name = params.get('name') ?? "";

        let response = {
            "data": [],
            "status": 0,
            "msg": "succeed",
            "row_count": 0
        }

        response.row_count = mock_data.length;

        console.log(`test: course_id: ${course_id}(type:${typeof course_id}), class_id: ${class_id}, page: ${page}, page_size: ${page_size}`)

        if (page == null || page_size == null) {
            return HttpResponse.json({
                "data": [],
                "status": -1,
                "msg": "page or pageSize is null",
                "row_count": 0
            })
        }

        if (course_id > 0 && class_id > 0) {
            
            // 如果课程ID和班级ID都存在，则返回Mock数据中和该班级ID相等的索引下的数据
            response.data = mock_data[class_id - 1];

        } else if (course_id > 0) {

            // 如果课程ID存在，并且班级ID不存在, 则返回前course_id条数据
            response.data = mock_data.filter((item) => item.id == course_id);

            response.row_count = response.data.length;

            console.log(`test: return ${course_id} data: ${JSON.stringify(response.data)}`)
            
        } else {
            
            switch (exam_type) {
            case "04":

                // 如果考试类型为资格证考试，则返回最后3条数据
                response.data = mock_data.slice(mock_data.length - 3, mock_data.length);

                break;
            default:
                // 返回数据 = mock_data从(page - 1)开始到(page_size)结束的数据, 若果page_size大于mock_data的长度，则返回mock_data的长度
                let max = Math.min(mock_data.length, page_size);

                response.data = mock_data.slice(page - 1, max);
                break;
            
            }

            
        }


        return HttpResponse.json(response)

    }),
    http.patch('/api/teacher/exam-grades', async(re) => {

        let body = await re.request.json();

        let exam_ids = body.exam_ids;

        for (let exam_data of mock_data) {
            for (let exam_id of exam_ids) {
                if (exam_data.id != exam_id) {
                    continue;
                }
                exam_data.submitted = true;
            }
        }

        console.log(`test: submitted exam_ids: ${exam_ids}, mock_data: ${JSON.stringify(mock_data)}`)

        return HttpResponse.json({
            "status": 0,
            "msg": "succeed",
        });

    })
)

beforeAll(() => { 
    server.listen({ onUnhandledRequest: 'error' });
})

afterEach(() => { server.resetHandlers() })

afterAll(() => { 
    server.close()
})

test("获取第1页的考试成绩信息, 每页最多10条数据", async () => {
    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    });

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 断言当前获取到的数据条数为默认的10条数据
    let testAPI = component.getForTesting();

    expect(testAPI.state.exam_info.length).toBe(10);

    unmount(component);
})

test("获取第2页的考试成绩信息, 每页最多10条数据", async () => {

    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    });

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 切换到第2页
    let testAPI = component.getForTesting();

    testAPI.methods.handlePageChoose(2);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info_cache[2].exam_info.length).toBe(10 - 2 + 1);
    });

    // 断言当前获取到的数据条数与响应返回的数据条数一致
    testAPI = component.getForTesting();

    expect(testAPI.state.exam_info.length).toBe(10 - 2 + 1);

    unmount(component);

})

test("获取第3页的考试成绩信息, 每页最多5条数据", async () => {
    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    });

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 设置每页最多5条数据
    let testAPI = component.getForTesting();

    testAPI.methods.handlePageSizeChange(5);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info.length).toBe(5);
    });

    // 切换到第3页
    testAPI = component.getForTesting();

    testAPI.methods.handlePageChoose(3);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info_cache[3].exam_info.length).toBe(5 - 3 + 1);
    });

    // 断言当前获取到的数据条数与响应返回的数据条数一致
    testAPI = component.getForTesting();

    expect(testAPI.state.exam_info.length).toBe(5 - 3 + 1);

    unmount(component);
})

test("获取下一页的考试成绩信息,然后再获取上一页的数据, 每页最多5条数据", async () => {
    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    })

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 设置每页最多5条数据
    let testAPI = component.getForTesting();

    testAPI.methods.handlePageSizeChange(5);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info.length).toBe(5);
    });

    // 切换到下一页
    testAPI = component.getForTesting();

    testAPI.methods.handlePageChange(true);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info_cache[2].exam_info.length).toBe(5 - 2 + 1);
    });

    // 断言当前获取到的数据条数与响应返回的数据条数一致
    testAPI = component.getForTesting();

    expect(testAPI.state.exam_info.length).toBe(5 - 2 + 1);

    // 切换到上一页
    testAPI = component.getForTesting();

    testAPI.methods.handlePageChange(false);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info_cache[1].exam_info.length).toBe(5 - 1 + 1);
    });

    // 断言当前获取到的数据条数与响应返回的数据条数一致
    testAPI = component.getForTesting();

    expect(testAPI.state.exam_info.length).toBe(5 - 1 + 1);

    // 再切换到上一页, 当前页数为1, 正常情况下再切换到上一页应该还是第一页
    testAPI = component.getForTesting();

    testAPI.methods.handlePageChange(false);

    // 等待数据加载完成
    let waitForPromise = waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info.length).toBe(5 - 0 + 1);
    });

    waitForPromise
    .then(() => {
        throw new Error("exam_info is equal to 6, while it should be 5");
    })
    .catch((err) => {
        unmount(component);
    });
    
});

test("选择资格证考试类型", async () => {
    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    })

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 选择资格证考试类型
    let testAPI = component.getForTesting();

    testAPI.methods.handleExamTypeFilter("04");

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info.length).toBe(3);
    });

    // 选择回全部考试类型
    testAPI = component.getForTesting();

    expect(testAPI.state.current_select_exam_type).toBe("04");

    testAPI.methods.handleExamTypeFilter("");

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info.length).toBe(mock_data.length);
    });

    testAPI = component.getForTesting();

    expect(testAPI.state.current_select_exam_type).toBe("");

    unmount(component);
})

test("提交考试成绩", async () => {
    const component = mount(ExamScoreManagementCard, {
        target: document.body,
    })

    // 等待数据加载完成
    await waitFor(() => {

        let testAPI = component.getForTesting(); 

        expect(testAPI.state.exam_info.length).toBeGreaterThan(0);
    });

    // 一次提交一条考试成绩
    let testAPI = component.getForTesting();

    testAPI.methods.handleExamSubmitted([1]);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info[0].submitted).toBe(true);
    });

    // 一次性提交多条考试成绩
    testAPI.methods.handleExamSubmitted([2,3]);

    // 等待数据加载完成
    await waitFor(() => {
        let testAPI = component.getForTesting();

        expect(testAPI.state.exam_info[1].submitted).toBe(true);
        expect(testAPI.state.exam_info[2].submitted).toBe(true);
    });

    unmount(component);
});
