# 可复现训练部署包打包脚本：精确筛选文件，排除模型权重/训练中间态/环境目录
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$src = $PSScriptRoot        # 本项目根目录（脚本所在目录），无需修改
$zipPath = Join-Path $src 'deepseek医疗专家-可复现部署.zip'
$root = 'deepseek医疗专家-可复现部署'   # zip 内根目录名

# 待打包文件：源绝对路径 -> zip 内相对路径
$map = [ordered]@{
  '复现与部署说明.md'                 = "$root/复现与部署说明.md"
  'README.md'                        = "$root/README.md"
  'requirements-gpu.txt'             = "$root/requirements-gpu.txt"
  'requirements-cpu.txt'             = "$root/requirements-cpu.txt"
  'data_process.py'                  = "$root/data_process.py"
  'deepseek_train.py'                = "$root/deepseek_train.py"
  'deepseek_merge.py'                = "$root/deepseek_merge.py"
  'deepseek_val.py'                  = "$root/deepseek_val.py"
  'deepseek_demo.py'                 = "$root/deepseek_demo.py"
  'deepseek_deploy.py'               = "$root/deepseek_deploy.py"
  'deepseek_deploy_ui.py'            = "$root/deepseek_deploy_ui.py"
  'deepseek_ui.html'                 = "$root/deepseek_ui.html"
  'model_download.py'                = "$root/model_download.py"
  'train_loss_plt.py'                = "$root/train_loss_plt.py"
  'data\medical_cot_zh.jsonl'        = "$root/data/medical_cot_zh.jsonl"
  'output\checkpoint-500\adapter_config.json'         = "$root/output/checkpoint-500/adapter_config.json"
  'output\checkpoint-500\adapter_model.safetensors'   = "$root/output/checkpoint-500/adapter_model.safetensors"
  'output\val_compare_20260910_103144.txt'            = "$root/output/val_compare_20260910_103144.txt"
  'output\train_val_loss_20260909_222946.png'         = "$root/output/train_val_loss_20260909_222946.png"
  'docs\现场演示脚本.md'              = "$root/docs/现场演示脚本.md"
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($k in $map.Keys) {
    $f = Join-Path $src $k
    if (-not (Test-Path $f)) { Write-Warning "缺失: $k"; continue }
    # CreateEntryFromFile 追加 ".zip" 扩展名处理：用 CreateEntry 手动写
    $entry = $zip.CreateEntry($map[$k], [System.IO.Compression.CompressionLevel]::Optimal)
    $es = $entry.Open()
    try { $fs = [System.IO.File]::OpenRead($f); try { $fs.CopyTo($es) } finally { $fs.Dispose() } }
    finally { $es.Dispose() }
    Write-Output "打包: $($map[$k])"
  }
} finally {
  $zip.Dispose()
}
Write-Output ('OK => {0}  ({1:N2} MB)' -f $zipPath, ((Get-Item $zipPath).Length / 1MB))

