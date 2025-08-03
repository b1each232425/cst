<!--
* @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-07-24 03:08:56
 * @LastEditors:  qjj qiaojunjie6@qq.com
 * @LastEditTime: 2025-07-24 03:08:56
 * @FilePath: \exam-fe\src\routes\teacher\question-bank-management\_components\bankcard.svelte
 * @Description: 题库卡片
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
 
-->
<!--                         o8o                 .   
                             `"'               .o8   
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo 
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888   
`"Y88b.  888        888      888   888   888   888   
o.  )88b 888   .o8  888      888   888   888   888 . 
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888" 
                                   888               
                                  o888o              
                                                      -->
<script>
	import { onMount } from "svelte";
	import EditableTag from "./editableTag.svelte";
	import { fade, slide } from "svelte/transition";
    import '$lib/styles/global.css';
	/**
	 * @typedef BankData
	 * @property {string}           id              - 题库ID
	 * @property {string}           name            - 题库名称
	 * @property {Array<string>}    [tags]          - 题库标签
	 * @property {string}           create_time     - 创建时间
	 * @property {string}           update_time     - 更新时间
	 * @property {boolean}          [selected]      - 是否选中
	 * @property {boolean}          [is_changed]    - 是否修改
	 */

	/**
	 * @type {{
	 *      type:               string;         // 卡片类型: 添加-add, 正常-normal
	 *      add_handle_func?:   function;       // 添加卡片的处理函数
	 *      icons?: {
	 *          big_add?:    string; // 添加图标路径
	 *          check_mark?: string; // 选中图标路径
	 *      };                                  // 图标路径数据
	 *      normal_handle_funcs?: {
	 *          edit?: function; // 编辑卡片的处理函数
	 *          save?: function; // 保存卡片的处理函数
	 *          delete?: function; // 删除卡片的处理函数
	 *          select?: function; // 选中卡片的处理函数
	 *          delete_tag?: (index: number) => void; // 删除tag的处理函数
	 *          add_tag?: (content: string) => void; // 添加tag的处理函数
	 *          tag_change?: (content: string, index: number) => void; // tag内容变化的处理函数, 输入时调用
	 *          tag_onchange?: (old_content:string, new_content: string, index: number) => void; // tag内容变化的处理函数, 失去焦点或按下回车时调用
	 *          name_change?: (content: string) => void; // 题库名称变化的处理函数
	 *          name_input_blur?: (content: string) => void; // 题库名称输入框失去焦点的处理函数
	 *          name_input_onchange?: (old_content:string, new_content: string) => void; // 题库名称变化的处理函数, 失去焦点或按下回车时调用
	 *          discard?: () => void; // 放弃修改的处理函数
	 *          logs?: () => void; // 查看日志的处理函数
	 *      };
	 *      data?: BankData;                    // 题库数据
	 * }}
	 */
	let { type, add_handle_func, icons, normal_handle_funcs, data } = $props();

	/**
	 * @type {string} 添加tag的输入框内容
	 */
	let add_tag_input = $state("");

	/**
	 * @type {boolean} 显示编辑按钮组
	 */
	let show_edit_btns = $state(false);

	/**
	 * @type {boolean} 显示更多选项
	 */
	let show_more_options = $state(false);

	/**
	 * @type {string} 原始题库名称
	 */
	let old_bank_name = $state(data?.name == null ? "" : data?.name);

	/**
	 * @type {string} 题库名称
	 */
	let bank_name = $state(data?.name == null ? "" : data?.name);

	/**
	 * @type {boolean} 是否删除
	 */
	let is_delete = $state(false);

	onMount(() => {
		switch (type) {
			case "add":
				if (!add_handle_func) {
					throw new Error("add_handle_func is required when type is 'add'");
				}
				break;
			case "normal":
				if (!data) {
					throw new Error("data is required when type is 'normal'");
				}

				if (!normal_handle_funcs) {
					console.warn("normal_handle_funcs is required when type is 'normal'");

					normal_handle_funcs = {};
				}

				if (normal_handle_funcs?.add_tag == null) {
					normal_handle_funcs.add_tag = (content) => {
						if (content == null || content == "") {
							return;
						}

						if (typeof content !== "string") {
							throw new Error("content must be a string");
						}

						console.log("添加tag:", content);

						console.warn(
							"Default add_tag function is strongly discouraged, because it will cause ownership_invalid_mutation[svelte:https://svelte.dev/e/ownership_invalid_mutation]. Please customize the add_tag function in normal_handle_funcs."
						);

						if (data?.tags) {
							data.tags.push(content);
						} else {
							data.tags = [content];
						}
					};
				}

				if (normal_handle_funcs?.delete_tag == null) {
					normal_handle_funcs.delete_tag = (index) => {
						console.log("删除tag:", index);

						console.warn(
							"Default delete_tag function is strongly discouraged, because it will cause ownership_invalid_mutation[svelte:https://svelte.dev/e/ownership_invalid_mutation]. Please customize the delete_tag function in normal_handle_funcs."
						);

						if (data?.tags) {
							data.tags.splice(index, 1);
						}
					};
				}
				break;
			default:
				throw new Error(`Invalid type: ${type}`);
		}
	});

	$effect(() => {
		// console.log("bank_data:", $state.snapshot(data))
		// console.log("bank_name:", bank_name)

		bank_name = data?.name == null ? "" : data?.name;
	});
</script>

<!-- 
    .                                          oooo                .             
  .o8                                          `888              .o8             
.o888oo  .ooooo.  ooo. .oo.  .oo.   oo.ooooo.   888   .oooo.   .o888oo  .ooooo.  
  888   d88' `88b `888P"Y88bP"Y88b   888' `88b  888  `P  )88b    888   d88' `88b 
  888   888ooo888  888   888   888   888   888  888   .oP"888    888   888ooo888 
  888 . 888    .o  888   888   888   888   888  888  d8(  888    888 . 888    .o 
  "888" `Y8bod8P' o888o o888o o888o  888bod8P' o888o `Y888""8o   "888" `Y8bod8P' 
                                     888                                         
                                    o888o                                        
                                                                                 
-->
<div class="bank-card-container">
	{#if type == "add"}
		<!-- 添加卡片 -->
		<button
			class="bank-add-card"
			onclick={() => {
				add_handle_func?.();
			}}
		>
			<img class="add-img" src={icons?.big_add} alt="添加" />
			<span class="add-text">点击此处添加题库</span>
		</button>
	{:else if type == "normal"}
		<!-- 常规卡片 -->
		<div
			class="bank-normal-card"
			class:changed={data?.is_changed}
			class:delete={is_delete}
			role="button"
			tabindex="0"
			onfocus={() => {}}
			onmouseover={() => {
				show_edit_btns = false;
			}}
			onmouseleave={() => {
				show_edit_btns = true;
			}}
		>
			<div class="bank-normal-content">
				<!-- 左上角选中复选框 -->
				<button
					class="check-mark"
					onclick={() => {
						normal_handle_funcs?.select?.();
					}}
					class:selected={data?.selected}
				>
					<img class="check-mark-img" src={icons?.check_mark} alt="选中" />
				</button>

				<!-- 题库名称 -->
				<input
					class="bank-name-input"
					placeholder="在此输入题库名称"
					bind:value={bank_name}
					onblur={() => {
						normal_handle_funcs?.name_input_blur?.(bank_name);
					}}
					oninput={() => {
						normal_handle_funcs?.name_change?.(bank_name);
					}}
					onchange={() => {
						normal_handle_funcs?.name_input_onchange?.(
							old_bank_name,
							bank_name
						);
					}}
					maxlength="30"
					title={bank_name}
				/>

				<!-- 题库操作时间 -->
				<div class="bank-time">
					<div class="bank-create-time">
						<span>{data?.create_time} 创建</span>
					</div>

					<div class="bank-update-time">
						<span>{data?.update_time} 更新</span>
					</div>
				</div>

				<!-- 题库标签列表 -->
				<div class="bank-tags-list">
					<div class="bank-tags-item">
						<EditableTag
							bind:content={add_tag_input}
							handle_funcs={{
								onchange: (old_content, new_content) => {
									add_tag_input = "";

									normal_handle_funcs?.add_tag?.(new_content);
								},
								delete: () => {
									add_tag_input = "";
								},
							}}
						/>
					</div>

					{#each data?.tags ?? [] as tag, index}
						<div class="bank-tags-item">
							<EditableTag
								content={tag}
								handle_funcs={{
									delete: () => normal_handle_funcs?.delete_tag?.(index),
									input_change: (content) => {
										normal_handle_funcs?.tag_change?.(content, index);
									},
									onchange: (old_content, new_content) => {
										normal_handle_funcs?.tag_onchange?.(
											old_content,
											new_content,
											index
										);
									},
								}}
							/>
						</div>
					{/each}
				</div>

				<!-- 编辑按钮组 -->
				
					<div class="bank-edit-btns" transition:slide={{ duration: 100 }} class:hidden={show_edit_btns}>
						<!-- 放弃修改 -->
						{#if data?.is_changed}
							<button
								class="bank-edit-btn"
								class:discard={true}
								transition:fade={{ duration: 100 }}
								title="点击放弃修改"
								onclick={() => {
									normal_handle_funcs?.discard?.();
								}}
							>
								<span>放弃修改</span>
							</button>
						{/if}

						<button
							class="bank-edit-btn"
							class:edit={true}
							onclick={() => {
								normal_handle_funcs?.edit?.();
							}}
							title="点击编辑题库"
						>
							<span>编辑</span>
						</button>
						<button
							class="bank-edit-btn"
							class:save={true}
							onclick={() => {
								normal_handle_funcs?.save?.();
							}}
							title="点击保存题库"
						>
							<span>保存</span>
						</button>

						<div
							class="more-options-group"
							tabindex="0"
							role="button"
							onmouseleave={() => {
								show_more_options = false;
							}}
						>
							<button
								class="bank-edit-btn"
								class:more={true}
								class:edit={true}
								onmouseenter={() => {
									show_more_options = true;
								}}
							>
								<span>更多</span>
							</button>

							{#if show_more_options}
								<div class="more-options-btns" 
                                    transition:slide={{ duration: 200}}
                                >
									<button
										class="bank-edit-btn"
										class:logs={true}
										onclick={() => {
                                            normal_handle_funcs?.logs?.();
                                        }}
										title="点击查看日志"
									>
										<span>日志</span>
									</button>

									<button
										class="bank-edit-btn"
										class:delete={true}
										onclick={() => {
											is_delete = true;
										}}
										title="点击删除题库"
									>
										<span>删除</span>
									</button>
								</div>
							{/if}
						</div>
					</div>
				
			</div>

			<div class="bank-delete-content">
				<div class="bank-delete-content-text">
					<div
						class="bank-delete-text"
						style="font-size: 22px; font-weight: 500;top: 15px;"
					>
						<span>确定删除题库？</span>
					</div>

					<div
						class="bank-delete-text"
						style="font-size: 20px;width: 90%; top: 54px;"
						class:name={true}
					>
						<span>{data?.name}</span>
					</div>

					<div
						class="bank-delete-text"
						style="font-size: 14px; top: 44px;text-decoration: underline; top: 104px;"
					>
						<span>题库删除后将无法恢复，请三思而后行!</span>
					</div>
				</div>

				<div class="bank-delete-btns">
					<button
						class="bank-delete-btn"
						onclick={() => {
							is_delete = false;
						}}
					>
						<span>取消</span>
					</button>

					<button
						class="bank-delete-btn"
						style="background-color:#e2e2e2"
						onclick={() => {
							is_delete = false;
							normal_handle_funcs?.delete?.();
						}}
					>
						<span>确定</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- 
             .               oooo            
           .o8               `888            
 .oooo.o .o888oo oooo    ooo  888   .ooooo.  
d88(  "8   888    `88.  .8'   888  d88' `88b 
`"Y88b.    888     `88..8'    888  888ooo888 
o.  )88b   888 .    `888'     888  888    .o 
8""888P'   "888"     .8'     o888o `Y8bod8P' 
                 .o..P'                      
                 `Y8P'                       
                                             
-->
<style lang="scss" scoped>
	.bank-card-container {
		display: flex;
		position: relative;
		width: 280px;
		height: 184px;
		padding: 2px 2px 2px 2px;
		border-radius: 14px;
		perspective: 100vh;

		.bank-add-card {
			position: relative;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			width: 100%;
			height: 100%;
			border: none;
			border-radius: 14px;
			box-sizing: border-box;
			background-color:var(--blue);
			cursor: pointer;

			.add-img {
				position: absolute;
				top: 24px;
				width: 79px;
			}

			.add-text {
				position: absolute;
				bottom: 40px;
				font-size: 20px;
				padding: 2px 2px 2px 2px;
				box-sizing: border-box;
				font-family: "Arial Bold", "Arial Normal", "Arial", sans-serif;
				font-weight: 700;
				color: var(--text-white);
				text-align: center;
			}

			&:hover {
				background-color:var(--primary-hover);
			}
		}

		.bank-normal-card {
			position: relative;
			width: inherit;
			height: inherit;
			border: 1px solid #cbcbcb;
			border-radius: 14px;
			background-color: var(--bg-primary);
			transform: rotateX(0deg);
			transition: all 0.4s ease-in-out;
			transform-style: preserve-3d;

			&:hover {
				.bank-delete-text.name {
					border-bottom: 2px solid #ffffff;
				}
			}

			&.delete {
				transform: rotateX(180deg);
			}

			&.changed {
				border: 1px solid #7490ff;
				box-shadow:
					0 0 10px 4px rgba(116, 144, 255, 0.8),
					0 0 5px 4px rgba(116, 144, 255, 0.6);
			}

			.bank-normal-content {
				display: flex;
				position: absolute;
				flex-direction: column;
				justify-content: flex-start;
				align-items: center;
				width: 100%;
				height: 100%;
				backface-visibility: hidden;
				transform: rotateX(0deg);
			}

			.bank-delete-content {
				display: flex;
				flex-direction: column;
				position: absolute;
				justify-content: flex-start;
				align-items: center;
				width: 100%;
				height: 100%;
				border-radius: 14px;
				box-sizing: border-box;
				backface-visibility: hidden;
				background-color: #e78288;
				transform: rotateX(180deg);
				box-shadow: 0px 2px 10px 0px rgba(150, 150, 150, 1);
				border: 1px solid rgba(49, 77, 191, 0.05);

				.bank-delete-content-text {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					width: 100%;
					height: max-content;
					font-size: 16px;
					font-family: "PingFangSC-Semibold", "PingFang SC Semibold",
						"PingFang SC", sans-serif;
					font-weight: 650;
					color: #ffffff;
					box-sizing: border-box;

					.bank-delete-text {
						position: absolute;
						display: flex;
						justify-content: center;
						align-items: center;
						width: 100%;
						height: max-content;
						font-size: 16px;
						font-family: "PingFangSC-Semibold", "PingFang SC Semibold",
							"PingFang SC", sans-serif;
						font-weight: 650;
						color: #ffffff;
						box-sizing: border-box;
					}
				}

				.bank-delete-btns {
					position: absolute;
					bottom: 15px;
					display: flex;
					justify-content: space-around;
					align-items: center;
					width: 90%;
					height: max-content;
					font-size: 16px;
					font-family: "PingFangSC-Semibold", "PingFang SC Semibold",
						"PingFang SC", sans-serif;
					font-weight: 650;
					color: #ffffff;

					.bank-delete-btn {
						display: flex;
						justify-content: center;
						align-items: center;
						width: 78px;
						height: 35px;
						padding: 0px 0px 0px 0px;
						margin: 0px 2px 0px 2px;
						border-radius: 3px;
						background-color: #ffffff;
						color: #333333;
						border: none;
						box-shadow: 0px 4px 8px 0px rgba(80, 80, 80, 0.35);
						cursor: pointer;

						&:hover {
							background-color: #efefef;
						}
					}
				}
			}

			.check-mark {
				position: absolute;
				top: 0;
				left: 0;
				width: 45.6px;
				height: 28.5px;
				border-radius: 14px 0 14px 0;
				border: 1px solid rgba(121, 121, 121, 0);
				background-color: rgba(147, 147, 147, 0.4);
				box-sizing: border-box;
				cursor: pointer;

				&:hover {
					background-color: #61b599;
				}

				&.selected {
					background-color: #3fbd93;
				}
			}

			.bank-name-input {
				position: relative;
				display: flex;
				top: 36px;
				width: 90%;
				border: none;
				border-bottom: 1px solid #a2a2a2;
				background-color: #ffffff;
				box-sizing: border-box;
				font-family: "PingFangSC-Semibold", "PingFang SC Semibold",
					"PingFang SC", sans-serif;
				font-size: 18px;
				font-weight: 650;
				color: #000000;
				text-align: left;

				&:focus {
					outline: none;
				}

				&::placeholder {
					font-size: 14px;
				}
			}

			.bank-time {
				position: relative;
				display: flex;
				justify-content: space-between;
				align-items: center;
				top: 64px;
				width: 90%;
				height: max-content;

				.bank-create-time {
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 10px;
					color: #afafaf;
				}

				.bank-update-time {
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 12px;
					color: #808080;
				}
			}

			.bank-tags-list {
				position: absolute;
				display: flex;
				flex-wrap: wrap;
				justify-content: flex-start;
				align-items: center;
				bottom: 20px;
				width: 90%;
				height: 46px;
				box-sizing: border-box;
				overflow-y: auto;
				scrollbar-width: none;
				.bank-tags-item {
					display: flex;
					justify-content: center;
					align-items: center;
					width: max-content;
					height: max-content;
					margin: 4px;
				}

				&:hover {
					scrollbar-width: thin;
				}
			}

			.bank-edit-btns {
			   
				position: absolute;
				display: flex;
				justify-content: flex-start;
				align-items: center;
				top: 0;
				right: 12px;
				width: max-content;
				height: max-content;
			}
			 .hidden {
              visibility: hidden;
         }

			.more-options-btns {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				width: max-content;
				height: max-content;
				position: absolute;
				background-color: #ffffff;
				box-shadow: 0 0 15px #bdbdbd;

				.bank-edit-btn {
					border-radius: 0;
				}
			}

			.bank-edit-btn {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 42px;
				height: 25px;
				font-size: 14px;
				padding: 0px;
				margin: 0px 1px 0px 1px;
				border: none;
				border-radius: 0 0 5px 5px;
				background-color: #ffffff00;
				cursor: pointer;

				&.discard {
					width: max-content;
					padding: 4px;
				}

				&.more {
					border-radius: 0;
				}

				&:hover {
					color: #ffffff;

					&.edit {
						background-color: #7490ff;
					}

					&.save {
						background-color: #48c79c;
					}

					&.delete {
						background-color: #f36d78;
					}

					&.discard {
						background-color: #858d9d;
					}

					&.more {
						background-color: #627ade;
					}

					&.logs {
						background-color: #627ade;
					}
				}
			}
		}
	}
</style>
