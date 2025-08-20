#!/usr/bin/bash
for submod in moveit_jacobian gjk_worker
do URL="git@github.com:TSUSAKA-ucl/$submod".git
   if git ls-remote "$URL" 1>/dev/null 2>/dev/null
   then echo "change to SSH access. $submod"
	git config submodule.wasm/"$submod".url "$URL"
   else echo "cannot access $submod using SSH"
   fi
done
