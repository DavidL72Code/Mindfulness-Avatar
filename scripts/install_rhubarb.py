import os
import platform
import shutil
import stat
import urllib.request
import zipfile


RHUBARB_VERSION = "1.14.0"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR_DIR = os.path.join(ROOT_DIR, "vendor", "rhubarb")
BIN_PATH = os.path.join(VENDOR_DIR, "rhubarb")
ZIP_PATH = os.path.join(VENDOR_DIR, "rhubarb.zip")


def get_release_asset_name():
    system = platform.system().lower()
    if system == "linux":
        suffix = "Linux"
    elif system == "darwin":
        suffix = "macOS"
    elif system == "windows":
        suffix = "Windows"
    else:
        raise RuntimeError(f"Unsupported Rhubarb platform: {platform.system()}")
    return f"Rhubarb-Lip-Sync-{RHUBARB_VERSION}-{suffix}.zip"


def get_rhubarb_url():
    return (
        "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/"
        f"v{RHUBARB_VERSION}/{get_release_asset_name()}"
    )


def find_extracted_binary():
    binary_names = {"rhubarb.exe"} if platform.system().lower() == "windows" else {"rhubarb"}
    for dirpath, _, filenames in os.walk(VENDOR_DIR):
        for filename in filenames:
            if filename in binary_names:
                return os.path.join(dirpath, filename)
    return None


def main():
    if os.path.exists(BIN_PATH):
        print(f"Rhubarb already installed at {BIN_PATH}")
        return

    os.makedirs(VENDOR_DIR, exist_ok=True)
    rhubarb_url = get_rhubarb_url()
    print(f"Downloading Rhubarb Lip Sync {RHUBARB_VERSION}...")
    urllib.request.urlretrieve(rhubarb_url, ZIP_PATH)

    with zipfile.ZipFile(ZIP_PATH) as archive:
        archive.extractall(VENDOR_DIR)
    os.remove(ZIP_PATH)

    extracted_bin = find_extracted_binary()
    if not extracted_bin:
        raise RuntimeError(f"Expected a Rhubarb binary in {VENDOR_DIR}")
    if os.path.abspath(extracted_bin) != os.path.abspath(BIN_PATH):
        shutil.copy2(extracted_bin, BIN_PATH)

    mode = os.stat(BIN_PATH).st_mode
    os.chmod(BIN_PATH, mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    print(f"Installed Rhubarb at {BIN_PATH}")


if __name__ == "__main__":
    main()
