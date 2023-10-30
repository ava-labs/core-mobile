brew_install() {
    if brew list $1 &>/dev/null; then
    # already installed
    :
    else
        echo "Installing $1\n"
        brew install $1
    fi
}

brew_install "trash"
echo "Deleting node modules"
find . -name 'node_modules' -type d -prune -exec trash '{}' +