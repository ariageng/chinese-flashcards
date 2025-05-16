import pandas as pd

# 读取 Excel 文件
df = pd.read_excel("/Users/tianyigeng/Downloads/Quick/swedish-flashcards/senlex.xlsx")

# 只保留所需列
df = df[["CEFR", "Word", "POS"]]

# 去除缺失值
df = df.dropna()

# 选取前 100 个测试（或删除这行导出全部）
# df = df.head(100)

# 生成 JavaScript 数组字符串
js_array = "export const words = [\n"
for _, row in df.iterrows():
    js_array += f'  {{ word: "{row["Word"]}", pos: "{row["POS"]}", level: "{row["CEFR"]}" }},\n'
js_array += "];\n"

# 写入到文件
with open("words.js", "w", encoding="utf-8") as f:
    f.write(js_array)

print("✅ 已生成 words.js！请将它放入 React 项目的 src/data 文件夹中。")
