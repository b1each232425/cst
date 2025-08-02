<script>

    const data = [
        { id: 1, name: '语文' },
        { id: 2, name: '数学' },
        { id: 3, name: '英语' }
    ];

    let selectedIDs = $state([]);      // 已选 ID 数组

    let allSelected = $state(false);    // 是否为全选状态

    // 选中数据
    function toggleSelection(id, checked) {
        if(checked) {
            selectedIDs.push(id);
        } else {
            selectedIDs = selectedIDs.filter(item => item !== id);
        }
    }

    // 检查全选
    $effect(() => {
        if(data.length !== 0 && data.every(item => selectedIDs.includes(item.id))) {
            allSelected = true;
        } else {
            allSelected = false;
        }
    });

    // 全选
    function selectedAll(checked) {
        const currentPageIDs = data.map(item => item.id);
        if(checked) {
            const currentPageIDs = data.map(item => item.id);
            const notYetSelected = currentPageIDs.filter(id => !selectedIDs.includes(id));
            selectedIDs = [...selectedIDs, ...notYetSelected];
        } else {
            selectedIDs = selectedIDs.filter(id => !currentPageIDs.includes(id));
        }
    }

</script>

已选id：{selectedIDs}

<table>
    <thead>
        <tr>
            <th>
                <input
                    type="checkbox"
                    bind:checked={allSelected}
                    onchange={(e) => selectedAll(e.target.checked)}
                >
            </th>
            <th>名称</th>
        </tr>
    </thead>

    <tbody>
        {#each data as item}
            <tr>
                <td>
                    <input
                        type="checkbox"
                        checked={selectedIDs.includes(item.id)}
                        onchange={(e) => toggleSelection(item.id, e.target.checked)}
                    >
                </td>
                <td>{item.name}</td>
            </tr>
        {/each}
    </tbody>
</table>