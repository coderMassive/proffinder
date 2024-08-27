'use client'
import { Box, Button, Stack, TextField, useMediaQuery } from '@mui/material'
import Alert from '@mui/material/Alert';
import { useState } from 'react'
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm a Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')
  const [professorID, setProfessorID] = useState('')
  const delay = ms => new Promise(res => setTimeout(res, ms));

  const [fieldOfStudy, setFieldOfStudy] = useState('')
  

  const [dialogMessage, setDialogMessage] = useState('')
  const [errorType, setErrorType] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)


  const marks = [
    {
      value: 0,
      label: '0★',
    },
    {
      value: 1,
      label: '1★',
    },
    {
      value: 2,
      label: '2★',
    },
    {
      value: 3,
      label: '3★',
    },
    {
      value: 4,
      label: '4★',
    },
    {
      value: 5,
      label: '5★',
    }
  ];

  const [reviewRange, setReviewRange] = useState([1, 3])

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setReviewRange(newValue as number[]);
  };

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
    let promptMessage = message
    if (fieldOfStudy != '') {
      promptMessage += ". Return professors in " + fieldOfStudy + " department" // add text based on fieldOfStudy
    }
    
    // review range
    promptMessage += ". Only include professors whose star ranges from " + reviewRange[0] + " to " + reviewRange[1]
  
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: promptMessage}]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
  
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  const addProfessor = async () => {
    setErrorType("info")
    setDialogMessage("Loading...")
    setDialogOpen(true)
    const response = await fetch('/api/prof', {
      method: 'POST',
      body: professorID,
    })
    
    const data = await response.json()

    if (!(data["success"])) {
      setErrorType("error")
    }
    else {
      setErrorType("success")      
    }
    setDialogMessage(data["message"])    

    await delay(3000)
    setErrorType('')
    setDialogOpen(false)
    setDialogMessage('')
  }

  const lightTheme = createTheme({
    palette: {
      primary: {
        main: '#ffffff',
      },
      secondary: {
        main: '#edf2ff',
      },
      background: {
        default: '#ffffff'
      }
    },
  });
  
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack direction={'row'} spacing={2} mb={2}>
        <Stack
          direction={'column'}
          width="500px"
          height="700px"
          border="1px solid black"
          p={2}
          spacing={3}
        >
          <Stack direction={'row'} spacing={2}>
            <TextField
              label="Professor ID"
              fullWidth
              type="number"
              value={professorID}

              sx={{
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                                         display: "none",
                                       },
               "& input[type=number]": {
                                         MozAppearance: "textfield",
                                       },
               }}
              onChange={(e) => setProfessorID(e.target.value)}
            />
            <Button variant="contained" onClick={addProfessor}>
              Add
            </Button>
          </Stack>
          <TextField
              label="Field of Study"
              fullWidth
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
            />

            <Stack direction={'row'} spacing={2}>
            <Typography variant="overline" display="block" gutterBottom>
              Review
            </Typography>
               <Slider
                onChange={handleSliderChange}
                value={reviewRange}
                valueLabelDisplay="auto"
                marks
                min={0}
                max={5}
              />
          </Stack>
        </Stack>
        

        <Stack
          direction={'column'}
          width="500px"
          height="700px"
          border="1px solid black"
          p={2}
          spacing={3}
        >
          <Stack
            direction={'column'}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === 'assistant' ? 'flex-start' : 'flex-end'
                }
              >
                <Box
                  bgcolor={
                    message.role === 'assistant'
                      ? '#1976D2'
                      : '#9C27B0'
                  }
                  color="#FFFFFF"
                  borderRadius={16}
                  p={3}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction={'row'} spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button variant="contained" onClick={sendMessage}>
              Send
            </Button>
          </Stack>
        </Stack>    
      </Stack>

      {dialogOpen && <Alert severity={errorType}>{dialogMessage}</Alert>}

    </Box>
  )
}