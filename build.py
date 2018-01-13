####################################

import os
import json
import shutil
import sys

####################################

def pf(x):
	print(x)
	sys.stdout.flush()

####################################

PROJECTS_DIR="projects"
CONFIG_PATH="config.json"

FILES_TO_COPY=[
    "gitinit.bat",
    "estart.bat",
    "c.bat",
    "p.bat",
    "bootstrap.min.css",
    "app.css",
    "index.html",
    "LICENSE",
    "main.ts",
    "main.js",
    "invis.vbs",
    "tsconfig.json",
    "vue.js",
    ".gitignore",
    "build.py"
]

####################################

pf("-----------------------")
pf(sys.argv)
pf("-----------------------")

####################################

if not os.path.exists(PROJECTS_DIR):
    pf("creating projects directory")
    os.makedirs(PROJECTS_DIR)

####################################

config=json.load(open(CONFIG_PATH))

projectname=config["projectname"]
projectdirectory=config["projectdirectory"]
projectdescription=config["projectdescription"]
projectkeywords=config["projectkeywords"]
projectlicence=config["projectlicence"]
githubuser=config["githubuser"]
githubrepo=config["githubrepo"]
githubusermail=config["githubusermail"]
projectauthor=config["projectauthor"]
projectnote=config["projectnote"]

githuburl="https://github.com/"+githubuser+"/"+githubrepo

projectdir=PROJECTS_DIR+"/"+projectdirectory

####################################

if os.path.exists(projectdir):        
    pf("deleting project")
    shutil.rmtree(projectdir)

if sys.argv[1]=="delete":
    sys.exit("project deleted ok")

####################################

pf("creating project directory "+projectdir)

os.makedirs(projectdir)

####################################

for file in FILES_TO_COPY:
    pf("copying "+file)
    shutil.copyfile(file,projectdir+"/"+file)

####################################

zbat=open("z.bat").read()

zbat=zbat.replace("telectron",projectdirectory)

pf("writing z.bat")

open(projectdir+"/z.bat","w").write(zbat)

####################################

packagejson=json.load(open("package.json"))

packagejson["name"]=projectname
packagejson["author"]=projectauthor
packagejson["license"]=projectlicence
packagejson["description"]=projectdescription
packagejson["keywords"]=projectkeywords.split(" ")
packagejson["repository"]=githuburl

pf("writing package.json")

with open(projectdir+"/package.json", 'w') as outfile:
    json.dump(packagejson, outfile, indent=2)

####################################

gitconfig=open(".gitconfig").read()

origgithuburl="https://github.com/typescriptelectron/typescriptelectron"

gitconfig=gitconfig.replace(origgithuburl,githuburl)
gitconfig=gitconfig.replace("name = typescriptelectron","name = "+githubuser)
gitconfig=gitconfig.replace("email = typescriptelectron@gmail.com","email = "+githubusermail)
gitconfig=gitconfig.replace("username = typescriptelectron","username = "+githubuser)

pf("writing .gitconfig")

open(projectdir+"/.gitconfig","w").write(gitconfig)

####################################

pf("writing Readme.md")

readme="# "+projectname+"\n\n"+projectdescription

open(projectdir+"/Readme.md","w").write(readme)

####################################

pf("copying .vscode")

shutil.copytree(".vscode",projectdir+"/.vscode")

####################################