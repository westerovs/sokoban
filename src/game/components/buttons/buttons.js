const applyInteractive = (target, {isButton = false} = {}) => {
  const props = {
    eventMode: 'static',
    cursor: 'pointer'
  }
  
  if (isButton) props.type = 'button'
  
  return Object.assign(target, props)
}

export {
  applyInteractive,
}

