// pages/contact.js

import { useState } from 'react';

export default function ContactCard() {
    const [contact, setContact] = useState({
        name: 'Nicolas Tobar',
        title: 'Founder Luna.AI',
        email: 'nicolas.tobarb@gmail.com',
        phone: '+18572009432',
    });

    return (
        <div className="card">
            <h2 className="name">{contact.name}</h2>
            <p className="title">{contact.title}</p>
            <p className="email">{contact.email}</p>
            <p className="phone">{contact.phone}</p>
            <style jsx>{`
                .card {
                    border: 1px solid #ddd;
                    box-shadow: 2px 2px 6px 0px  rgba(0,0,0,0.20);
                    border-radius: 8px;
                    width: 300px;
                    padding: 16px;
                    margin: 16px auto;
                    text-align: center;
                    box-shadow: 0 0 40px -10px #45a293;
                    transition: transform 0.4s ease-in-out;
                }
                .card:hover {
                    background: rgb(190,195,196);
                    background: linear-gradient(90deg, rgba(190,195,196,1) 29%, rgba(43,69,98,1) 70%);
                    
                    transform: scale(1.05);
                    box-shadow: 0 0 30px -10px #45a293;
                    box-shadow: 0 0 30px -10px #ff8700;
                    box-shadow: 0 0 30px -10px black;
                    background-size: 300% 100%;
                    background-position:right bottom;
                    transition:all 0.8s ease-in-out;
                }
                .name {
                    font-size: 24px;
                    color: #44acaa;
                }
                .title {
                    font-size: 18px;
                    color: #666;
                }
                .email, .phone {
                    font-size: 16px;
                    color: #999;
                }
            `}</style>
        </div>
    );
}
