<script>
  import { onMount } from "svelte";
  /**
   * @type {Array<{
   *   id: number,//考场ID
   *   name: string,//考场名称
   *   exam_site_name: string,// 考点名称
   *   capacity: number,// 考场容量
   *   exam_sites: Array<{
   *     id: number,
   *     name: string
   *   }>
   * }>}
   */
  let examRooms = $state([]);
  let total_num = $state(0);
  let total_pages = $state(0);

  /**
   * @type {Array<{
   *   id: number,
   *   name: string
   * }>}
   */
  let exam_sites = $state([]);

  /**
   * 获取考场和考点数据
   *
   * @param {number} page - 当前页码，默认为1
   * @param {number} page_size - 每页显示数量，默认为10
   * @param {string} search_text - 搜索关键词（考点/考场名）
   * @param {string} site_id - 选中的考点ID
   * @param {string} start_time - 开始时间
   * @param {string} end_time - 结束时间
   * @param {string} exam_id - 考试ID
   */
  async function getExamData(
    page = 1,
    page_size = 10,
    search_text = "",
    site_id = "",
    start_time = "2025-05-02 13:00:00",
    end_time = "2025-05-02 14:00:00",
    exam_id = "",
  ) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: page_size.toString(),
        searchText: search_text,
        siteID: site_id,
        startTime: start_time,
        endTime: end_time,
        examId: exam_id,
      });
      console.log("查询参数:", queryParams.toString());

      const response = await fetch(`/api/admin/exam-room?${queryParams}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("获取数据失败");
      }

      const responseData = await response.json();
      if (responseData.status !== 0) {
        console.error("获取数据失败:", responseData.msg);
        return;
      }

      // 后端返回的数据结构为 {
      //	Status:   0,
      //	Msg:      "Get exam sites successful",
      //	API:      "/api/admin/exam-room",
      //	Method:   "Get",
      //	Data:      {rooms: [], sites: [] },
      //	RowCount: 10,
      //}
      if (!responseData.data) {
        examRooms = [];
        exam_sites = [];
      } else {
        examRooms = responseData.data;
      }
      console.log("获取数据成功:", examRooms);
      total_num = responseData.rowCount;
      total_pages = Math.ceil(total_num / page_size);
    } catch (error) {
      console.error("Error fetching exam data:", error);
    }
  }

  onMount(async () => {
    await getExamData();
  });
</script>
