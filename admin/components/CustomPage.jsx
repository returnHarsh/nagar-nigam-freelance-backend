import React from 'react'
import { ApiClient, Box, Button, H1 } from 'adminjs'

const api = new ApiClient()

const CustomPage = () => {
  const handleClick = async () => {
    const response = await api.get('/admin/api/pages/runMyFunction') // Calls your handler
    console.log(response)
    alert(response.notice?.message || "Done!")
  }

  return (
    <Box>
      <H1>Run Custom Function</H1>
      <Button onClick={handleClick}>Run Function</Button>
    </Box>
  )
}

export default CustomPage
