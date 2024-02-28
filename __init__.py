import folder_paths
import shutil
import sys
import platform
import os
import atexit
from pathlib import Path



VERSION = "1.0"
ADDON_NAME = "API映射"
COMFY_PATH = Path(folder_paths.__file__).parent
CUR_PATH = Path(__file__).parent
CATEGORY = "daming"


def change_dict_b_list(dict,klist,value):#嵌套字典赋值
    point = dict[klist[0]]
    for i in range(1,len(klist)-1):
        point = point[klist[i]]
    point[klist[-1]] = value


def change_dict_b_list_save(dict,klist,value):#嵌套字典赋值
    try:
        dict[klist[0]]
    except KeyError as e:
        dict[klist[0]] = {}
    point = dict[klist[0]]
    for i in range(1,len(klist)-1):
        try:
            point[klist[i]]
        except KeyError as e:
            point[klist[i]] = {}
        point = point[klist[i]]
    point[klist[-1]] = value


class DaMingAPIMapping:#API端口重映射
    default = '''
"seed":
[
  "offset":0,
  "value":("seed"),
  "id_rule":"1"
]
,
"positive":
[
  "offset":0,
  "value":("text","value"),
  "id_rule":"node._meta.title=='正向'"
]
'''
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "info": ("STRING", {"multiline": True,"default": s.default}),
            },
        }

    FUNCTION = "doit"
    CATEGORY = CATEGORY
    RETURN_TYPES = ("STRING", )

    def doit(self, info):
        return ()      

NODE_CLASS_MAPPINGS = {
    "DaMingAPIMapping":DaMingAPIMapping,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DaMingAPIMapping":"API映射",
}



def rmtree(path: Path):
    # unlink symbolic link
    if Path(path.resolve()).as_posix() != path.as_posix():
        path.unlink()
        return
    if not path.exists():
        return
    if path.is_file():
        path.unlink()
    elif path.is_dir():
        # 移除 .git
        if path.name == ".git" and platform.system() == "darwin":
            from subprocess import call
            call(['rm', '-rf', path.as_posix()])
            return
        for child in path.iterdir():
            rmtree(child)
        try:
            path.rmdir()  # nas 的共享盘可能会有残留
        except BaseException:
            ...


def register():
    _ext_path = COMFY_PATH.joinpath("web", "extensions", ADDON_NAME)
    rmtree(_ext_path)
    link_func = shutil.copytree
    if os.name == "nt":
        import _winapi
        link_func = _winapi.CreateJunction
    try:
        link_func((CUR_PATH).as_posix(), _ext_path.as_posix())
    except Exception as e:
        sys.stderr.write(f"[register error]: {e}\n")
        sys.stderr.flush()
    return

def unregister():
    # 移除缓存json
    # for data in CUR_PATH.glob("*.json"):
    #     if not data.name.startswith("translations_"):
    #         continue
    #     data.unlink()

    _ext_path = COMFY_PATH.joinpath("web", "extensions", ADDON_NAME)
    try:
        rmtree(_ext_path)
    except BaseException:
        ...


register()
atexit.register(unregister)
