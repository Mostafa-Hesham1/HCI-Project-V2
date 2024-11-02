/*
	TUIO C# Demo - part of the reacTIVision project
	Copyright (c) 2005-2016 Martin Kaltenbrunner <martin@tuio.org>

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

using System;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Collections.Generic;
using System.Collections;
using System.Threading;
using TUIO;
using System.IO;
using System.Drawing.Drawing2D;
using System.Net.Sockets;
using System.Text;



public class TuioDemo : Form, TuioListener
{
    private TuioClient client;
    private Dictionary<long, TuioObject> objectList;
    private Dictionary<long, TuioCursor> cursorList;
    private Dictionary<long, TuioBlob> blobList;

    public static int width, height;
    private int window_width = 640;
    private int window_height = 480;
    private int window_left = 0;
    private int window_top = 0;
    private int screen_width = Screen.PrimaryScreen.Bounds.Width;
    private int screen_height = Screen.PrimaryScreen.Bounds.Height;
    public int prev_id = -1;
    public int selected_id = 1;
    private bool fullscreen;
    private bool verbose;
    private bool displayStretchPage = false;
    private float leftMarkerX = 0, leftMarkerY = 0;
    private float rightMarkerX = 0, rightMarkerY = 0;
    private bool isGoodStretch = false;
    private int stretchCount = 0;


    public string serverIP = "DESKTOP-8161GCK"; // IP address of the Python server
    public int port = 8000;               // Port number matching the Python server
    int flag = 0;
    Font font = new Font("Arial", 10.0f);
    SolidBrush fntBrush = new SolidBrush(Color.White);
    SolidBrush bgrBrush = new SolidBrush(Color.FromArgb(0, 0, 64));
    SolidBrush curBrush = new SolidBrush(Color.FromArgb(192, 0, 192));
    SolidBrush objBrush = new SolidBrush(Color.FromArgb(64, 0, 0));
    SolidBrush blbBrush = new SolidBrush(Color.FromArgb(64, 64, 64));
    Pen curPen = new Pen(new SolidBrush(Color.Blue), 1);
    private string objectImagePath;
    private string backgroundImagePath;
    TcpClient client1;
    NetworkStream stream;
    public TuioDemo(int port)
    {

        verbose = false;
        fullscreen = false;
        width = window_width;
        height = window_height;

        this.ClientSize = new System.Drawing.Size(width, height);
        this.Name = "TuioDemo";
        this.Text = "TuioDemo";

        this.Closing += new CancelEventHandler(Form_Closing);
        this.KeyDown += new KeyEventHandler(Form_KeyDown);

        this.SetStyle(ControlStyles.AllPaintingInWmPaint |
                        ControlStyles.UserPaint |
                        ControlStyles.DoubleBuffer, true);

        objectList = new Dictionary<long, TuioObject>(128);
        cursorList = new Dictionary<long, TuioCursor>(128);
        blobList = new Dictionary<long, TuioBlob>(128);
        readpatient();
        client = new TuioClient(port);
        client.addTuioListener(this);

        client.connect();

        // Create a TCP/IP socket
        client1 = new TcpClient("localhost", 65434);
        // Get the stream to send data
        stream = client1.GetStream();

    }

    private void Form_KeyDown(object sender, System.Windows.Forms.KeyEventArgs e)
    {

        if (e.KeyData == Keys.F1)
        {
            if (fullscreen == false)
            {

                width = screen_width;
                height = screen_height;

                window_left = this.Left;
                window_top = this.Top;

                this.FormBorderStyle = FormBorderStyle.None;
                this.Left = 0;
                this.Top = 0;
                this.Width = screen_width;
                this.Height = screen_height;

                fullscreen = true;
            }
            else
            {

                width = window_width;
                height = window_height;

                this.FormBorderStyle = FormBorderStyle.Sizable;
                this.Left = window_left;
                this.Top = window_top;
                this.Width = window_width;
                this.Height = window_height;

                fullscreen = false;
            }
        }
        else if (e.KeyData == Keys.Escape)
        {
            // Close everything
            stream.Close();
            client1.Close();
            this.Close();

        }
        else if (e.KeyData == Keys.V)
        {
            verbose = !verbose;
        }

    }
    public class patient
    {
        public string name, id, inj, exer;
    }
    List<patient> patients = new List<patient>();
    void readpatient()
    {
        StreamReader SR = new StreamReader("Users.txt");
        while (!SR.EndOfStream)
        {

            string line = SR.ReadLine();
            string[] temp = line.Split(',');
            patient pnn = new patient();
            pnn.id = temp[0];
            pnn.name = temp[1];
            pnn.inj = temp[2];
            pnn.exer = temp[3];
            //MessageBox.Show("" + temp[0] + temp[1] + temp[2] + temp[3]);
            patients.Add(pnn);
        }
        SR.Close();
    }
    private void Form_Closing(object sender, System.ComponentModel.CancelEventArgs e)
    {
        client.removeTuioListener(this);

        client.disconnect();
        System.Environment.Exit(0);
    }

    public void addTuioObject(TuioObject o)
    {
        lock (objectList)
        {
            objectList.Add(o.SessionID, o);
        }
        if (verbose) Console.WriteLine("add obj " + o.SymbolID + " (" + o.SessionID + ") " + o.X + " " + o.Y + " " + o.Angle);
    }

    public void updateTuioObject(TuioObject o)
    {
        if (verbose) Console.WriteLine("set obj " + o.SymbolID + " " + o.SessionID + " " + o.X + " " + o.Y + " " + o.Angle + " " + o.MotionSpeed + " " + o.RotationSpeed + " " + o.MotionAccel + " " + o.RotationAccel);

        if (o.SymbolID == 22) // Left marker
        {
            leftMarkerX = o.getX() * width;
            leftMarkerY = o.getY() * height;
        }
        else if (o.SymbolID == 23) // Right marker
        {
            rightMarkerX = o.getX() * width;
            rightMarkerY = o.getY() * height;
        }
        else if (o.SymbolID == 2) // Clear page and reset stretch
        {
            displayStretchPage = true;
            stretchCount = 0; // reset counter if needed
            Invalidate(); // Redraw the screen to clear it
        }

        if (displayStretchPage)
        {
            float distance = (float)Math.Sqrt((rightMarkerX - leftMarkerX) * (rightMarkerX - leftMarkerX) + (rightMarkerY - leftMarkerY) * (rightMarkerY - leftMarkerY));
            bool previousStretch = isGoodStretch;
            isGoodStretch = distance > 300; // Threshold for a good stretch

            if (isGoodStretch && !previousStretch)
            {
                stretchCount++;
            }

            Invalidate(); // Refresh the form to update UI with new information
        }
    }

    public void removeTuioObject(TuioObject o)
    {
        lock (objectList)
        {
            objectList.Remove(o.SessionID);
        }
        if (verbose) Console.WriteLine("del obj " + o.SymbolID + " (" + o.SessionID + ")");
    }

    public void addTuioCursor(TuioCursor c)
    {
        lock (cursorList)
        {
            cursorList.Add(c.SessionID, c);
        }
        if (verbose) Console.WriteLine("add cur " + c.CursorID + " (" + c.SessionID + ") " + c.X + " " + c.Y);
    }

    public void updateTuioCursor(TuioCursor c)
    {
        if (verbose) Console.WriteLine("set cur " + c.CursorID + " (" + c.SessionID + ") " + c.X + " " + c.Y + " " + c.MotionSpeed + " " + c.MotionAccel);
    }

    public void removeTuioCursor(TuioCursor c)
    {
        lock (cursorList)
        {
            cursorList.Remove(c.SessionID);
        }
        if (verbose) Console.WriteLine("del cur " + c.CursorID + " (" + c.SessionID + ")");
    }

    public void addTuioBlob(TuioBlob b)
    {
        lock (blobList)
        {
            blobList.Add(b.SessionID, b);
        }
        if (verbose) Console.WriteLine("add blb " + b.BlobID + " (" + b.SessionID + ") " + b.X + " " + b.Y + " " + b.Angle + " " + b.Width + " " + b.Height + " " + b.Area);
    }

    public void updateTuioBlob(TuioBlob b)
    {

        if (verbose) Console.WriteLine("set blb " + b.BlobID + " (" + b.SessionID + ") " + b.X + " " + b.Y + " " + b.Angle + " " + b.Width + " " + b.Height + " " + b.Area + " " + b.MotionSpeed + " " + b.RotationSpeed + " " + b.MotionAccel + " " + b.RotationAccel);
    }

    public void removeTuioBlob(TuioBlob b)
    {
        lock (blobList)
        {
            blobList.Remove(b.SessionID);
        }
        if (verbose) Console.WriteLine("del blb " + b.BlobID + " (" + b.SessionID + ")");
    }

    public void refresh(TuioTime frameTime)
    {
        Invalidate();
    }
    int f = 0;
    protected override void OnPaintBackground(PaintEventArgs pevent)
    {
        // Getting the graphics object
        Graphics g = pevent.Graphics;
        g.FillRectangle(bgrBrush, new Rectangle(0, 0, width, height));
        if (displayStretchPage)
        {
            string stretchStatus = isGoodStretch ? "Good Stretch! Count: " + stretchCount : "Keep Stretching...";
            g.DrawString(stretchStatus, font, fntBrush, new PointF(10, 40)); // Display stretching status
        }

        // draw the cursor path
        if (cursorList.Count > 0)
        {
            lock (cursorList)
            {
                foreach (TuioCursor tcur in cursorList.Values)
                {
                    List<TuioPoint> path = tcur.Path;
                    TuioPoint current_point = path[0];

                    for (int i = 0; i < path.Count; i++)
                    {
                        TuioPoint next_point = path[i];
                        g.DrawLine(curPen, current_point.getScreenX(width), current_point.getScreenY(height), next_point.getScreenX(width), next_point.getScreenY(height));
                        current_point = next_point;
                    }
                    g.FillEllipse(curBrush, current_point.getScreenX(width) - height / 100, current_point.getScreenY(height) - height / 100, height / 50, height / 50);
                    g.DrawString(tcur.CursorID + "", font, fntBrush, new PointF(tcur.getScreenX(width) - 10, tcur.getScreenY(height) - 10));
                }
            }
        }

        string[,] exercisesTable = {
                                {"ID", "Name", "Leg Injuries", "Exercise"},
                                {"1", "John Doe", "Knee Sprain", "Quad Stretch"},
                                {"2", "Jane Smith", "Hamstring Strain", "Hamstring Curl"},
                                {"3", "Tom Lee", "Ankle Sprain", "Calf Raises"},
                                {"4", "Anna Brown", "IT Band Syndrome", "Side-Lying Leg Lifts"},
                                {"5", "Michael Clark", "Shin Splints", "Toe Taps"},
                                {"6", "Emily Davis", "Achilles Tendonitis", "Eccentric Heel Drops"},
                                {"7", "David Harris", "Quadriceps Strain", "Straight Leg Raise"},
                                {"8", "Sophia Miller", "Groin Strain", "Hip Adductor Stretch"},
                                {"9", "James Wilson", "Calf Strain", "Seated Calf Stretch"},
                                {"10", "Olivia Moore", "Hip Flexor Strain", "Hip Flexor Stretch"},
                                {"11", "Liam Martinez", "Patellar Tendonitis", "Wall Squats"},
                                {"12", "Mia Rodriguez", "Piriformis Syndrome", "Piriformis Stretch"},
                                {"13", "William King", "ACL Tear", "Balance Exercises"},
                                {"14", "Isabella Perez", "Meniscus Tear", "Step-Ups"},
                                {"15", "Henry Turner", "Torn Hamstring", "Hamstring Stretch"},
                                {"16", "Ava Scott", "Plantar Fasciitis", "Towel Stretch"},
                                {"17", "Alexander Green", "Sciatica", "Pelvic Tilt"},
                                {"18", "Charlotte Baker", "Hip Labral Tear", "Clamshell Exercise"},
                                {"19", "Benjamin Hill", "IT Band Friction", "Foam Rolling"}
                            };
        // Draw the objects
        if (objectList.Count > 0)
        {
            lock (objectList)
            {
                foreach (TuioObject tobj in objectList.Values)
                {
                    int ox = tobj.getScreenX(width);
                    int oy = tobj.getScreenY(height);
                    int size = height / 10;

                    // Draw the object rectangle
                    g.FillRectangle(objBrush, new Rectangle(ox - size / 2, oy - size / 2, size, size));
                    g.DrawString(tobj.SymbolID.ToString(), font, fntBrush, new PointF(ox - 10, oy - 10));

                    // Handling the drawing and logic for specific Symbol IDs
                    switch (tobj.SymbolID)
                    {
                        case 0:

                            g.DrawString("Selected ID", font, fntBrush, new PointF(this.Width - 100, 80));
                            g.DrawString(selected_id.ToString(), font, fntBrush, new PointF(this.Width - 100, 100));

                            // Check if the ID has changed
                            if (tobj.SymbolID != prev_id)
                            {
                                flag = 1;
                                if (f == 0)
                                {
                                    SendMarkerData("the table displayed");
                                }
                                f = 1;
                                prev_id = tobj.SymbolID;

                            }
                            UpdateSelectedIdBasedOnRotation(tobj);
                            break;

                        case 5:
                            if (tobj.SymbolID != prev_id)
                            {
                                prev_id = tobj.SymbolID;

                                string rowData = $"Selected ID: {exercisesTable[selected_id, 0]}, " + // ID
                                        $"Name: {exercisesTable[selected_id, 1]}, " + // Name
                                        $"Leg Injury: {exercisesTable[selected_id, 2]}, " + // Leg Injuries
                                        $"Exercise: {exercisesTable[selected_id, 3]}"; // Exercise
                                SendMarkerData("the selected patient :" + rowData);

                            }

                            break;
                        case 2:
                            if (tobj.SymbolID != prev_id)
                            {
                                prev_id = tobj.SymbolID;
                            }
                            break;

                        default:
                            if (tobj.SymbolID != prev_id)
                            {
                                prev_id = tobj.SymbolID;
                            }
                            continue;
                    }
                }
                if (flag == 1)
                {
                    Font headerFont = new Font("Arial", 14, FontStyle.Bold);
                    Font tableFont = new Font("Arial", 12);
                    Brush tableBrush = Brushes.White;
                    Brush headerBrush = Brushes.Yellow;

                    float x = 0;
                    float y = 0;
                    float rowHeight = 30f;
                    float colWidth = 150f;
                    float padding = 10f;
                    Pen pen = new Pen(Color.Black, 2);

                    // Drawing the header
                    string[] headers = { "ID", "Name", "Injury", "Exercise" };
                    for (int j = 0; j < headers.Length; j++)
                    {
                        g.DrawString(headers[j], headerFont, headerBrush, new PointF(x + (j * colWidth) + padding, y + padding));
                    }

                    // Draw a border line under the header
                    g.DrawLine(pen, x, y + rowHeight, x + (colWidth * headers.Length), y + rowHeight);

                    // Drawing the patients from the list
                    for (int i = 0; i < patients.Count; i++)
                    {
                        patient p = patients[i];
                        // Highlight the selected patient row
                        if (p.id == selected_id.ToString())
                        {
                            g.FillRectangle(Brushes.Red, new RectangleF(x, y + ((i + 1) * rowHeight), colWidth * headers.Length, rowHeight));
                        }
                        string[] patientInfo = { p.id, p.name, p.inj, p.exer };
                        for (int j = 0; j < patientInfo.Length; j++)
                        {
                            // Draw each cell with some padding
                            g.DrawString(patientInfo[j], tableFont, tableBrush, new PointF(x + (j * colWidth) + padding, y + ((i + 1) * rowHeight) + padding));
                        }
                        // Draw a border line between rows for clarity
                        g.DrawLine(pen, x, y + ((i + 2) * rowHeight), x + (colWidth * headers.Length), y + ((i + 2) * rowHeight)); // Horizontal border
                    }

                    // Draw vertical borders for the entire table
                    for (int j = 0; j <= headers.Length; j++)
                    {
                        g.DrawLine(pen, x + (j * colWidth), y, x + (j * colWidth), y + (rowHeight * (patients.Count + 1))); // Vertical border
                    }

                    pen.Dispose();
                }
            }

        }

        // Draw the blobs (if necessary)
        if (blobList.Count > 0)
        {
            lock (blobList)
            {
                foreach (TuioBlob tblb in blobList.Values)
                {
                    int bx = tblb.getScreenX(width);
                    int by = tblb.getScreenY(height);
                    float bw = tblb.Width * width;
                    float bh = tblb.Height * height;

                    g.TranslateTransform(bx, by);
                    g.RotateTransform((float)(tblb.Angle / Math.PI * 180.0f));
                    g.TranslateTransform(-bx, -by);

                    g.FillEllipse(blbBrush, bx - bw / 2, by - bh / 2, bw, bh);

                    g.TranslateTransform(bx, by);
                    g.RotateTransform(-1 * (float)(tblb.Angle / Math.PI * 180.0f));
                    g.TranslateTransform(-bx, -by);

                    g.DrawString(tblb.BlobID + "", font, fntBrush, new PointF(bx, by));
                }
            }
        }
    }
    private float previousAngle = 0;
    private void UpdateSelectedIdBasedOnRotation(TuioObject tobj)
    {
        // Get the current angle of the marker
        float currentAngle = tobj.Angle * (180 / (float)Math.PI); // Convert radians to degrees

        // Normalize angles to be within [0, 360)
        currentAngle = NormalizeAngle(currentAngle);
        previousAngle = NormalizeAngle(previousAngle);

        // Calculate the difference
        float angleDifference = currentAngle - previousAngle;

        // Check if the difference indicates a right (clockwise) rotation
        if (angleDifference > 10) // Adjust threshold as necessary
        {
            selected_id++; // Increment the selected ID
            SendMarkerData("The selected patient updated");
            if (selected_id > patients.Count) // Reset if it exceeds the number of exercises
            {
                selected_id = 1; // Reset to the first exercise
            }
        }
        // Check if the difference indicates a left (counterclockwise) rotation
        else if (angleDifference < -10) // Adjust threshold as necessary
        {
            selected_id--; // Decrement the selected ID
            SendMarkerData("The selected patient updated");
            if (selected_id < 1) // Reset if it goes below 1
            {
                selected_id = patients.Count; // Reset to the last exercise
            }
        }

        // Optional: Add logging for debugging
        Console.WriteLine($"Current Angle: {currentAngle}, Previous Angle: {previousAngle}, Selected ID: {selected_id}");

        // Update previous angle for the next frame
        previousAngle = currentAngle;
    }

    private float NormalizeAngle(float angle)
    {
        // Normalize the angle to the range [0, 360)
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    public static void Main(String[] argv)
    {
        int port = 0;
        switch (argv.Length)
        {
            case 1:
                port = int.Parse(argv[0], null);
                if (port == 0) goto default;
                break;
            case 0:
                port = 3333;
                break;
            default:
                Console.WriteLine("usage: mono TuioDemo [port]");
                System.Environment.Exit(0);
                break;
        }

        TuioDemo app = new TuioDemo(port);
        Application.Run(app);
    }
    public void SendMarkerData(string s)
    {

        try
        {
            // Replace with your TUIO marker data
            // string markerData1 = $"Marker ID: {markerData.SymbolID.ToString()}, X: {markerData.X.ToString()}, Y: {markerData.Y.ToString()}";
            // string markerData1 = $"Selected ID :P{s}";

            // Convert the marker data to byte array
            byte[] data = Encoding.UTF8.GetBytes(s);


            // Send the marker data to the server
            stream.Write(data, 0, data.Length);
            Console.WriteLine("Sent: {0}", s);


        }
        catch (Exception e)
        {
            Console.WriteLine("Exception: {0}", e);
        }
    }
}