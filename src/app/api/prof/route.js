import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import axios from 'axios'
import OpenAI from 'openai'
import * as cheerio from "cheerio";


const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
})
const index = pc.index('rag').namespace('ns1')
const openai = new OpenAI()

export async function POST(req) {
    const data = await req.text()
    console.log("RECEIVED " + data);
    let response;
    try {
        response = await axios.get("https://www.ratemyprofessors.com/professor/" + data)
    }
    catch (err) {
        if (err.response) {
            return new NextResponse(JSON.stringify({success: false, message: "Failed to get information on professor ID " + data}, {status: err.response.status}));
        }
    }
    const selector = cheerio.load(response.data);

    const name = selector("div.NameTitle__Name-dowf0z-0 > span").first().text() + " " + selector("span.NameTitle__LastNameWrapper-dowf0z-2").first().text().slice(0, -1)
    const subject = selector("a.TeacherDepartment__StyledDepartmentLink-fl79e8-0 > b").first().text().slice(0, -11)
    const stars = parseInt(selector("div.RatingValue__Numerator-qw8sqy-2").first().text())   
    let processed_data = []
    let reviews = []

    selector("div.Comments__StyledComments-dzzyvm-0").each(async (i, element) => {
        reviews.push(selector(element).text())
    })

    for (let i = 0; i < reviews.length; i++) {
        const embedding = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: reviews[i],
        })
        const embeddingData = embedding.data[0].embedding
        processed_data.push({
            "values": embeddingData,
            "id": name + " - Review #" + i,
            "metadata": {
                "review": reviews[i],
                "subject": subject,
                "stars": stars,
            }
        })
    }
    // console.log(processed_data)
    await index.upsert(processed_data);
    // console.log("Upserted " + processed_data.length + " items")
    return new NextResponse(JSON.stringify({success: true, message: "Upserted " + processed_data.length + " items"}, {status: 200}));
}